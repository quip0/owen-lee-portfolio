"""Kraus operator definitions and factory functions."""

import numpy as np
from .utils import PAULI_I, PAULI_X, PAULI_Y, PAULI_Z


class KrausOperator:
    """A single Kraus operator matrix with an optional label."""

    def __init__(self, matrix, label=""):
        self._matrix = np.asarray(matrix, dtype=complex)
        self.label = label

    @property
    def matrix(self):
        return self._matrix

    def adjoint(self):
        return KrausOperator(self._matrix.conj().T, label=f"{self.label}†")

    def __repr__(self):
        return f"KrausOperator(label={self.label!r}, shape={self._matrix.shape})"


def validate_kraus_set(operators):
    """Check completeness: Σ E_k† E_k ≈ I."""
    d = operators[0].matrix.shape[0]
    total = sum(op.adjoint().matrix @ op.matrix for op in operators)
    return np.allclose(total, np.eye(d, dtype=complex))


# ── Factory functions ───────────────────────────────────────────

def bit_flip_operators(p):
    """Bit-flip channel: E0 = √(1-p)·I, E1 = √p·X."""
    return [
        KrausOperator(np.sqrt(1 - p) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p) * PAULI_X, label="E1"),
    ]


def phase_flip_operators(p):
    """Phase-flip channel: E0 = √(1-p)·I, E1 = √p·Z."""
    return [
        KrausOperator(np.sqrt(1 - p) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p) * PAULI_Z, label="E1"),
    ]


def depolarizing_operators(p):
    """Depolarizing channel: E0 = √(1-3p/4)·I, E1..3 = √(p/4)·{X,Y,Z}."""
    return [
        KrausOperator(np.sqrt(1 - 3 * p / 4) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p / 4) * PAULI_X, label="E1"),
        KrausOperator(np.sqrt(p / 4) * PAULI_Y, label="E2"),
        KrausOperator(np.sqrt(p / 4) * PAULI_Z, label="E3"),
    ]


def amplitude_damping_operators(gamma):
    """Amplitude-damping channel."""
    e0 = np.array([[1, 0], [0, np.sqrt(1 - gamma)]], dtype=complex)
    e1 = np.array([[0, np.sqrt(gamma)], [0, 0]], dtype=complex)
    return [
        KrausOperator(e0, label="E0"),
        KrausOperator(e1, label="E1"),
    ]
