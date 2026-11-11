"""Provider gain changes must not hide drift in the CLONE timing check."""
import importlib.util
from pathlib import Path

import numpy as np


def module():
    path = Path(__file__).resolve().parents[2] / "work/reference-20261110-batch/align_clone_avatar.py"
    spec = importlib.util.spec_from_file_location("clone_clock", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def signal(rate):
    rng = np.random.default_rng(42)
    return np.convolve(rng.normal(0, .2, rate * 8), np.ones(7) / 7, mode="same")


def test_variable_gain_preserves_clock_without_relaxing_identity():
    mod = module()
    source = signal(mod.SR)
    gain = np.repeat(np.linspace(.2, .95, 16), mod.SR // 2)
    avatar = np.concatenate([np.zeros(368), source * gain])
    result = mod.gain_invariant_clock(source, avatar, 23)
    assert result["pass"]
    assert result["correlation"] > .999
    assert result["maxResidualLagMs"] == 0


def test_changed_timing_fails_despite_gain_fitting():
    mod = module()
    source = signal(mod.SR)
    shifted = source.copy()
    midpoint = len(source) // 2
    shift = mod.SR // 10
    shifted[midpoint:] = source[midpoint - shift:-shift]
    avatar = np.concatenate([np.zeros(368), shifted])
    result = mod.gain_invariant_clock(source, avatar, 23)
    assert not result["pass"]
    assert result["maxResidualLagMs"] >= 99
