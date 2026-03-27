"""Qiskit interoperability — lazy imports so qnoise works without Qiskit."""

import numpy as np
from .state import QuantumState


def from_qiskit_statevector(sv):
    """Convert a qiskit.quantum_info.Statevector to QuantumState."""
    return QuantumState.from_statevector(np.asarray(sv.data, dtype=complex))


def from_qiskit_density_matrix(dm):
    """Convert a qiskit.quantum_info.DensityMatrix to QuantumState."""
    return QuantumState(np.asarray(dm.data, dtype=complex))


def from_qiskit_circuit(circuit, initial_state=None):
    """Run a Qiskit QuantumCircuit and return the resulting QuantumState.

    Uses Qiskit's Statevector simulator internally.  If *initial_state* is
    provided it is used as the starting state; otherwise |0…0⟩ is assumed.
    """
    from qiskit.quantum_info import Statevector  # lazy import

    if initial_state is not None:
        sv = Statevector(initial_state.matrix @ np.array([1] + [0] * (initial_state.matrix.shape[0] - 1)))
    else:
        sv = Statevector.from_instruction(circuit)
    return QuantumState.from_statevector(np.asarray(sv.data, dtype=complex))


def to_qiskit_density_matrix(state):
    """Convert a QuantumState to qiskit.quantum_info.DensityMatrix."""
    from qiskit.quantum_info import DensityMatrix  # lazy import
    return DensityMatrix(state.matrix)
