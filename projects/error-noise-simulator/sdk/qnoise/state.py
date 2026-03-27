"""QuantumState — density-matrix representation of an n-qubit state."""

import numpy as np
from .utils import PAULI_X, PAULI_Y, PAULI_Z, partial_trace as _partial_trace

# Pre-built statevectors for common labels
_LABEL_MAP = {
    "0": np.array([1, 0], dtype=complex),
    "1": np.array([0, 1], dtype=complex),
    "+": np.array([1, 1], dtype=complex) / np.sqrt(2),
    "-": np.array([1, -1], dtype=complex) / np.sqrt(2),
}


class QuantumState:
    """Density-matrix wrapper for an n-qubit quantum state."""

    def __init__(self, density_matrix):
        dm = np.asarray(density_matrix, dtype=complex)
        if dm.ndim != 2 or dm.shape[0] != dm.shape[1]:
            raise ValueError("Density matrix must be square.")
        self._matrix = dm

    # ── Constructors ────────────────────────────────────────────

    @classmethod
    def from_statevector(cls, sv):
        sv = np.asarray(sv, dtype=complex).ravel()
        return cls(np.outer(sv, sv.conj()))

    @classmethod
    def from_label(cls, label):
        if len(label) == 1:
            sv = _LABEL_MAP.get(label)
            if sv is None:
                raise ValueError(f"Unknown single-qubit label: {label!r}")
            return cls.from_statevector(sv)
        # multi-qubit: tensor product of individual labels
        parts = [_LABEL_MAP[ch] for ch in label]
        sv = parts[0]
        for p in parts[1:]:
            sv = np.kron(sv, p)
        return cls.from_statevector(sv)

    @classmethod
    def zero(cls, n_qubits=1):
        d = 2 ** n_qubits
        dm = np.zeros((d, d), dtype=complex)
        dm[0, 0] = 1.0
        return cls(dm)

    # ── Properties ──────────────────────────────────────────────

    @property
    def n_qubits(self):
        return int(np.log2(self._matrix.shape[0]))

    @property
    def matrix(self):
        return self._matrix

    # ── Measures ────────────────────────────────────────────────

    def purity(self):
        """Tr(ρ²)."""
        return float(np.real(np.trace(self._matrix @ self._matrix)))

    def fidelity(self, other):
        """Fidelity between two density matrices: Tr(√(√ρ σ √ρ))²."""
        sqrt_rho = _matrix_sqrt(self._matrix)
        product = sqrt_rho @ other._matrix @ sqrt_rho
        sqrt_product = _matrix_sqrt(product)
        return float(np.real(np.trace(sqrt_product)) ** 2)

    def von_neumann_entropy(self):
        """S(ρ) = -Tr(ρ log₂ ρ)."""
        eigenvalues = np.real(np.linalg.eigvalsh(self._matrix))
        eigenvalues = eigenvalues[eigenvalues > 1e-15]
        return float(-np.sum(eigenvalues * np.log2(eigenvalues)))

    def bloch_vector(self):
        """Return [x, y, z] Bloch vector.  Only valid for single-qubit states."""
        if self.n_qubits != 1:
            raise ValueError("Bloch vector is only defined for single-qubit states.")
        rho = self._matrix
        x = float(np.real(np.trace(rho @ PAULI_X)))
        y = float(np.real(np.trace(rho @ PAULI_Y)))
        z = float(np.real(np.trace(rho @ PAULI_Z)))
        return [x, y, z]

    def probabilities(self):
        """Measurement probabilities in the computational basis."""
        return np.real(np.diag(self._matrix)).tolist()

    # ── Transformations ─────────────────────────────────────────

    def partial_trace(self, keep):
        dm = _partial_trace(self._matrix, keep)
        return QuantumState(dm)

    def apply(self, channel, target_qubits=None):
        return channel.apply(self, target_qubits)

    # ── Display ─────────────────────────────────────────────────

    def __repr__(self):
        return f"QuantumState(n_qubits={self.n_qubits}, purity={self.purity():.4f})"


def _matrix_sqrt(m):
    """Compute the matrix square root of a positive-semidefinite matrix."""
    eigvals, eigvecs = np.linalg.eigh(m)
    eigvals = np.maximum(eigvals, 0)
    return eigvecs @ np.diag(np.sqrt(eigvals)) @ eigvecs.conj().T
