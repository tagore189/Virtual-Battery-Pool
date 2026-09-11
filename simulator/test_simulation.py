import unittest
import numpy as np

from config import GRID_IMBALANCE_COEFF, GRID_NOMINAL_FREQ, NUM_BATTERIES
from environment import Environment, WEATHER_PRESETS
from renewable import SolarModel, WindModel, RenewableGenerator
from load import LoadModel
from grid import GridSimulator
from battery import Battery
from scenario import ScenarioEngine


class TestVirtualBatteryPoolSimulation(unittest.TestCase):
    """Phase 1 integration tests for the Virtual Battery Pool environmental simulation.

    Sign convention:
        Battery power > 0 → discharging (injecting kW into grid)
        Battery power < 0 → charging    (absorbing kW from grid)

    Power balance formula:
        power_imbalance = renewable_generation + net_battery_power - load
    """

    def setUp(self):
        self.env = Environment()
        self.solar = SolarModel()
        self.wind = WindModel()
        self.load = LoadModel()
        self.grid = GridSimulator()
        self.batteries = [Battery(f"BAT-{i:03d}") for i in range(1, NUM_BATTERIES + 1)]
        self.scenarios = ScenarioEngine()

    # ─── Test 1: Normal Operation ───────────────────────────────────────

    def test_01_normal_operation(self):
        """Normal clear-day midday: solar > 0, wind > 0, load > 0, frequency within bounds."""
        self.env.set_weather("clear")
        self.env.set_time_of_day(12.0)

        solar_gen = self.solar.calculate_generation(self.env)
        wind_gen = self.wind.calculate_generation(self.env)
        total_load = self.load.calculate_load(self.env)

        self.assertGreater(solar_gen, 0.0, "Solar should be positive at midday clear sky")
        self.assertGreater(wind_gen, 0.0, "Wind should be positive at 6 m/s")
        self.assertGreater(total_load, 10.0, "Load should be significant")

        # Simulate one timestep
        for b in self.batteries:
            b.step(0.5)
        net_battery_power = sum(b.power for b in self.batteries)
        power_imbalance = (solar_gen + wind_gen) + net_battery_power - total_load
        freq = self.grid.step(0.5, power_imbalance=power_imbalance)

        self.assertTrue(49.0 <= freq <= 51.0, f"Frequency {freq} out of bounds")
        print(f"[TEST 1 PASS] Normal: Solar={solar_gen:.2f}kW, Wind={wind_gen:.2f}kW, "
              f"Load={total_load:.2f}kW, BattNet={net_battery_power:.2f}kW, "
              f"Imbalance={power_imbalance:.2f}kW, Freq={freq}Hz")

    # ─── Test 2: Cloud Passing ──────────────────────────────────────────

    def test_02_cloud_passing(self):
        """Cloud passing scenario: solar generation should decrease with increasing cloud cover."""
        self.env.set_weather("clear")
        self.env.set_time_of_day(12.0)
        solar_clear = self.solar.calculate_generation(self.env)

        # Activate cloud passing and step to peak cloud
        self.scenarios.set_scenario("cloud_passing", self.env, self.batteries, self.grid)
        self.scenarios.step(7.5, self.env, self.batteries, self.grid)  # ~peak cloud

        solar_cloudy = self.solar.calculate_generation(self.env)
        self.assertLess(solar_cloudy, solar_clear, "Solar should decrease with cloud cover")
        self.assertGreater(self.env.cloud_cover, 50.0, "Cloud cover should be high at peak")

        # Verify grid responds
        total_ren = solar_cloudy + self.wind.calculate_generation(self.env)
        total_load = self.load.calculate_load(self.env)
        power_imbalance = total_ren - total_load
        freq = self.grid.step(0.5, power_imbalance=power_imbalance)
        self.assertTrue(49.0 <= freq <= 51.0)

        print(f"[TEST 2 PASS] Cloud Passing: Clear Solar={solar_clear:.2f}kW -> "
              f"Cloudy Solar={solar_cloudy:.2f}kW, CloudCover={self.env.cloud_cover:.1f}%, Freq={freq}Hz")

    # ─── Test 3: Night Operation ────────────────────────────────────────

    def test_03_night_operation(self):
        """Night: solar ≈ 0, load still active, grid/battery system responds."""
        self.env.set_weather("night")
        solar_gen = self.solar.calculate_generation(self.env)
        wind_gen = self.wind.calculate_generation(self.env)
        total_load = self.load.calculate_load(self.env)

        self.assertAlmostEqual(solar_gen, 0.0, delta=0.1, msg="Solar should be ~0 at night")
        self.assertGreater(total_load, 5.0, "Load should remain active at night")

        power_imbalance = (solar_gen + wind_gen) - total_load
        freq = self.grid.step(0.5, power_imbalance=power_imbalance)
        self.assertTrue(49.0 <= freq <= 51.0)

        print(f"[TEST 3 PASS] Night: Solar={solar_gen:.2f}kW, Wind={wind_gen:.2f}kW, "
              f"Load={total_load:.2f}kW, Imbalance={power_imbalance:.2f}kW, Freq={freq}Hz")

    # ─── Test 4: Evening Peak ───────────────────────────────────────────

    def test_04_evening_peak(self):
        """Evening peak: solar drops, load increases significantly."""
        self.scenarios.set_scenario("evening_peak", self.env, self.batteries, self.grid)
        solar_gen = self.solar.calculate_generation(self.env)
        total_load = self.load.calculate_load(self.env)

        self.assertLess(solar_gen, 5.0, "Solar should be very low at 19:00 with irradiance=50")
        self.assertGreater(total_load, 30.0, "Load should be high during evening peak (1.4x)")

        power_imbalance = (solar_gen + self.wind.calculate_generation(self.env)) - total_load
        self.assertLess(power_imbalance, 0.0, "Power deficit expected at evening peak")
        freq = self.grid.step(0.5, power_imbalance=power_imbalance)
        self.assertTrue(49.0 <= freq <= 51.0)

        print(f"[TEST 4 PASS] Evening Peak: Solar={solar_gen:.2f}kW, Load={total_load:.2f}kW, "
              f"Imbalance={power_imbalance:.2f}kW, Freq={freq}Hz")

    # ─── Test 5: Storm ──────────────────────────────────────────────────

    def test_05_storm_scenario(self):
        """Storm: low solar, high variable wind, power balance fluctuates."""
        self.scenarios.set_scenario("storm", self.env, self.batteries, self.grid)
        solar_gen = self.solar.calculate_generation(self.env)
        wind_gen = self.wind.calculate_generation(self.env)

        self.assertLess(solar_gen, 5.0, "Solar should be very low during storm")
        # Wind at 20 m/s is above rated (12), so should be at full capacity
        self.assertGreater(wind_gen, 20.0, "Wind should be high during storm (above rated speed)")

        power_imbalance = (solar_gen + wind_gen) - self.load.calculate_load(self.env)
        freq = self.grid.step(0.5, power_imbalance=power_imbalance)
        self.assertTrue(49.0 <= freq <= 51.0)

        print(f"[TEST 5 PASS] Storm: Solar={solar_gen:.2f}kW, Wind={wind_gen:.2f}kW, Freq={freq}Hz")

    # ─── Test 6: Solar Drop ─────────────────────────────────────────────

    def test_06_solar_drop(self):
        """Solar drop: irradiance drops to 100, solar generation drops significantly."""
        self.env.set_time_of_day(12.0)
        self.scenarios.set_scenario("solar_drop", self.env, self.batteries, self.grid)
        solar_gen = self.solar.calculate_generation(self.env)

        self.assertLess(solar_gen, 3.0, "Solar should be very low with irradiance=100 and cloud=75%")
        print(f"[TEST 6 PASS] Solar Drop: Solar={solar_gen:.2f}kW, Irradiance={self.env.solar_irradiance}")

    # ─── Test 7: High Wind ──────────────────────────────────────────────

    def test_07_high_wind(self):
        """High wind: wind generation increases according to turbine curve."""
        self.scenarios.set_scenario("high_wind", self.env, self.batteries, self.grid)
        wind_gen = self.wind.calculate_generation(self.env)

        # 16 m/s > rated speed of 12 m/s → full capacity (25 kW)
        self.assertAlmostEqual(wind_gen, 25.0, delta=0.1,
                               msg="Wind at 16 m/s (above rated) should be at full capacity")
        print(f"[TEST 7 PASS] High Wind: Wind={wind_gen:.2f}kW at {self.env.wind_speed:.1f} m/s")

    # ─── Test 8: Sudden Load Increase ───────────────────────────────────

    def test_08_sudden_load_increase(self):
        """Sudden load increase: load multiplier 1.8x, power deficit expected."""
        self.env.set_time_of_day(12.0)
        baseline_load = self.load.calculate_load(self.env)

        self.scenarios.set_scenario("sudden_load_increase", self.env, self.batteries, self.grid)
        peak_load = self.load.calculate_load(self.env)

        self.assertGreater(peak_load, baseline_load * 1.5,
                           "Load with 1.8x multiplier should be significantly higher")
        print(f"[TEST 8 PASS] Sudden Load: Baseline={baseline_load:.2f}kW -> "
              f"Peak={peak_load:.2f}kW (x{peak_load/baseline_load:.2f})")

    # ─── Test 9: Renewable Collapse ─────────────────────────────────────

    def test_09_renewable_collapse(self):
        """Renewable collapse: both solar and wind drop sharply."""
        self.env.set_time_of_day(12.0)
        self.scenarios.set_scenario("renewable_collapse", self.env, self.batteries, self.grid)
        solar_gen = self.solar.calculate_generation(self.env)
        wind_gen = self.wind.calculate_generation(self.env)

        self.assertLess(solar_gen, 2.0, "Solar should be very low after collapse")
        self.assertAlmostEqual(wind_gen, 0.0, delta=0.1,
                               msg="Wind at 1.5 m/s (below cut-in 3.0) should be 0")
        print(f"[TEST 9 PASS] Renewable Collapse: Solar={solar_gen:.2f}kW, Wind={wind_gen:.2f}kW")

    # ─── Test 10: Battery Failure ───────────────────────────────────────

    def test_10_battery_failure(self):
        """Battery failure: faulted battery stops contributing, uses existing fault mechanism."""
        self.scenarios.set_scenario("battery_failure", self.env, self.batteries, self.grid)

        self.assertTrue(self.batteries[0].fault, "Battery 0 should be faulted")
        self.assertEqual(self.batteries[0].power, 0.0, "Faulted battery should have 0 power")

        # Battery.mode is updated during step(), so call step first
        self.batteries[0].step(0.5)
        self.assertEqual(self.batteries[0].mode, "fault", "Faulted battery mode should be 'fault'")

        # Verify other batteries still work
        self.assertFalse(self.batteries[1].fault, "Battery 1 should NOT be faulted")

        # Verify the faulted battery rejects commands (existing Battery.command() behavior)
        self.batteries[0].command("discharge", 5.0)
        self.assertEqual(self.batteries[0]._target_power, 0.0,
                         "Faulted battery should ignore commands")

        print(f"[TEST 10 PASS] Battery Failure: BAT-001 faulted, others operational.")

    # ─── Test 11: Multiple Battery Failure ──────────────────────────────

    def test_11_multiple_battery_failure(self):
        """Multiple battery failure: 3 batteries faulted."""
        self.scenarios.set_scenario("multiple_battery_failure", self.env, self.batteries, self.grid)

        fault_count = sum(1 for b in self.batteries if b.fault)
        self.assertEqual(fault_count, 3, "Exactly 3 batteries should be faulted")

        # Non-faulted batteries should still be operational
        operational = [b for b in self.batteries if not b.fault]
        self.assertEqual(len(operational), NUM_BATTERIES - 3)
        for b in operational:
            b.command("discharge", 2.0)
            self.assertEqual(b._target_power, 2.0, f"{b.id} should accept commands")

        print(f"[TEST 11 PASS] Multiple Battery Failure: {fault_count} faulted, "
              f"{len(operational)} operational.")

    # ─── Test 12: Grid Disturbance ──────────────────────────────────────

    def test_12_grid_disturbance(self):
        """Grid disturbance: triggers existing disturbance mechanism, no controller modification."""
        freq_before = self.grid.step(0.5, power_imbalance=0.0)

        self.scenarios.set_scenario("grid_disturbance", self.env, self.batteries, self.grid)
        freq_after = self.grid.step(0.5, power_imbalance=0.0)

        # The disturbance should cause a noticeable frequency change
        self.assertNotAlmostEqual(freq_before, freq_after, delta=0.01,
                                  msg="Grid disturbance should produce a frequency change")
        self.assertTrue(49.0 <= freq_after <= 51.0, "Frequency should remain within bounds")

        print(f"[TEST 12 PASS] Grid Disturbance: Before={freq_before}Hz, After={freq_after}Hz")

    # ─── Test 13: Manual Dispatch Compatibility ─────────────────────────

    def test_13_manual_dispatch_compatibility(self):
        """Existing manual battery dispatch: command sets _target_power, step ramps power."""
        b = self.batteries[0]
        b.fault = False

        # Test discharge command
        b.command("discharge", 4.0)
        self.assertEqual(b._target_power, 4.0, "Discharge command should set positive target")
        b.step(0.5)
        self.assertGreater(b.power, 0.0, "Power should ramp toward positive target")

        # Test charge command
        b.command("charge", 3.0)
        self.assertEqual(b._target_power, -3.0, "Charge command should set negative target")

        # Test idle command
        b.command("idle", 0)
        self.assertEqual(b._target_power, 0.0, "Idle command should set zero target")

        print(f"[TEST 13 PASS] Manual Dispatch: command/step/ramp verified.")

    # ─── Test 14: Environment Clamping ──────────────────────────────────

    def test_14_environment_clamping(self):
        """Invalid/extreme environment values are safely clamped, no crashes."""
        self.env.set_cloud_cover(150.0)
        self.assertEqual(self.env.cloud_cover, 100.0, "Cloud cover should clamp at 100")

        self.env.set_cloud_cover(-10.0)
        self.assertEqual(self.env.cloud_cover, 0.0, "Cloud cover should clamp at 0")

        self.env.set_wind_speed(-10.0)
        self.assertEqual(self.env.wind_speed, 0.0, "Wind speed should clamp at 0")

        self.env.set_solar_irradiance(-500.0)
        self.assertEqual(self.env.solar_irradiance, 0.0, "Irradiance should clamp at 0")

        self.env.set_solar_irradiance(2000.0)
        self.assertEqual(self.env.solar_irradiance, 1500.0, "Irradiance should clamp at 1500")

        self.env.set_temperature(100.0)
        self.assertEqual(self.env.temperature, 60.0, "Temperature should clamp at 60")

        self.env.set_temperature(-50.0)
        self.assertEqual(self.env.temperature, -20.0, "Temperature should clamp at -20")

        self.env.set_humidity(200.0)
        self.assertEqual(self.env.humidity, 100.0, "Humidity should clamp at 100")

        self.env.set_load_multiplier(0.0)
        self.assertEqual(self.env.load_multiplier, 0.1, "Load multiplier should clamp at 0.1")

        self.env.set_load_multiplier(10.0)
        self.assertEqual(self.env.load_multiplier, 5.0, "Load multiplier should clamp at 5.0")

        # Verify invalid weather is rejected
        result = self.env.set_weather("blizzard")
        self.assertFalse(result, "Invalid weather state should be rejected")

        print(f"[TEST 14 PASS] All clamping and validation verified.")

    # ─── Test 15: Scenario Reset & Isolation ────────────────────────────

    def test_15_scenario_reset_and_isolation(self):
        """Scenario reset fully removes scenario modifications, no state leakage."""
        # Apply storm scenario
        self.scenarios.set_scenario("storm", self.env, self.batteries, self.grid)
        self.assertEqual(self.env.weather, "storm")
        self.assertGreater(self.env.cloud_cover, 90.0)

        # Reset to normal
        self.scenarios.reset(self.env, self.batteries)
        self.assertEqual(self.env.weather, "clear", "Weather should be 'clear' after reset")
        self.assertEqual(self.env.cloud_cover, 10.0, "Cloud cover should return to clear preset")
        self.assertEqual(self.env.load_multiplier, 1.0, "Load multiplier should return to 1.0")
        self.assertEqual(self.scenarios.active_scenario, "normal")

        # Apply battery failure, then reset
        self.scenarios.set_scenario("battery_failure", self.env, self.batteries, self.grid)
        self.assertTrue(self.batteries[0].fault, "Battery 0 should be faulted by scenario")

        self.scenarios.reset(self.env, self.batteries)
        self.assertFalse(self.batteries[0].fault,
                         "Battery 0 fault should be cleared by scenario reset")

        # Apply evening peak (load multiplier=1.4), then switch to storm
        self.scenarios.set_scenario("evening_peak", self.env, self.batteries, self.grid)
        self.assertEqual(self.env.load_multiplier, 1.4)

        self.scenarios.set_scenario("storm", self.env, self.batteries, self.grid)
        self.assertEqual(self.env.load_multiplier, 1.0,
                         "Previous scenario load multiplier should be cleared when switching")
        self.assertEqual(self.env.weather, "storm", "Storm weather should be applied")

        print(f"[TEST 15 PASS] Scenario reset and isolation verified.")

    # ─── Test 16: All Scenarios Execute ─────────────────────────────────

    def test_16_all_scenarios_execute(self):
        """All 12 scenarios initialize and step without errors."""
        for sc in ScenarioEngine.SCENARIOS:
            result = self.scenarios.set_scenario(sc, self.env, self.batteries, self.grid)
            self.assertTrue(result, f"Scenario '{sc}' failed to initialize")
            self.scenarios.step(0.5, self.env, self.batteries, self.grid)

        print(f"[TEST 16 PASS] All {len(ScenarioEngine.SCENARIOS)} scenarios executed successfully.")

    # ─── Test 17: Power Scale Consistency ───────────────────────────────

    def test_17_power_scale_consistency(self):
        """Verify power values are within coherent microgrid scale."""
        self.env.set_weather("clear")
        self.env.set_time_of_day(12.0)

        solar_gen = self.solar.calculate_generation(self.env)
        wind_gen = self.wind.calculate_generation(self.env)
        total_load = self.load.calculate_load(self.env)

        # Solar capacity 30 kW, wind capacity 25 kW, base load 25 kW
        self.assertLessEqual(solar_gen, 30.0, "Solar should not exceed 30 kW capacity")
        self.assertLessEqual(wind_gen, 25.0, "Wind should not exceed 25 kW capacity")
        self.assertGreater(total_load, 10.0, "Load should be meaningful")
        self.assertLess(total_load, 100.0, "Load should be within microgrid scale")

        # With default coefficient, normal imbalance should not cause extreme frequency deviation
        imbalance = (solar_gen + wind_gen) - total_load
        freq_effect = abs(GRID_IMBALANCE_COEFF * imbalance)
        self.assertLess(freq_effect, 0.5,
                        f"Normal imbalance ({imbalance:.1f}kW) should not cause >{0.5}Hz deviation")

        print(f"[TEST 17 PASS] Power Scale: Solar={solar_gen:.2f}kW, Wind={wind_gen:.2f}kW, "
              f"Load={total_load:.2f}kW, Imbalance={imbalance:.2f}kW, "
              f"FreqEffect={freq_effect:.4f}Hz")


if __name__ == "__main__":
    unittest.main(verbosity=2)
