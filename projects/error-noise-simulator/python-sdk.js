/**
 * python-sdk.js
 * Embeds the qnoise Python SDK as string constants for Pyodide.
 * Each export maps to a file that will be written into the Pyodide virtual FS.
 */

export const SDK_FILES = {
  "__init__.py": `"""qnoise \u2014 A quantum noise and error simulation SDK."""

from .state import QuantumState
from .channels import NoiseChannel, BitFlip, PhaseFlip, Depolarizing, AmplitudeDamping
from .operators import KrausOperator
from .simulator import Simulator

__version__ = "0.1.0"

__all__ = [
    "QuantumState",
    "NoiseChannel",
    "BitFlip",
    "PhaseFlip",
    "Depolarizing",
    "AmplitudeDamping",
    "KrausOperator",
    "Simulator",
]
`,

  "utils.py": `"""Shared math helpers and Pauli matrices."""

import numpy as np

PAULI_I = np.eye(2, dtype=complex)
PAULI_X = np.array([[0, 1], [1, 0]], dtype=complex)
PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
PAULI_Z = np.array([[1, 0], [0, -1]], dtype=complex)


def tensor(*matrices):
    result = matrices[0]
    for m in matrices[1:]:
        result = np.kron(result, m)
    return result


def expand_operator(op, target, n_qubits):
    parts = [PAULI_I] * n_qubits
    parts[target] = op
    return tensor(*parts)


def partial_trace(rho, keep, dims=None):
    n = int(np.log2(rho.shape[0]))
    if dims is None:
        dims = [2] * n
    keep = sorted(keep)
    trace_out = sorted(set(range(n)) - set(keep))
    rho_tensor = rho.reshape(dims + dims)
    for i, idx in enumerate(trace_out):
        ax1 = idx - i
        ax2 = ax1 + (n - i)
        rho_tensor = np.trace(rho_tensor, axis1=ax1, axis2=ax2)
    d_keep = int(np.prod([dims[k] for k in keep]))
    return rho_tensor.reshape(d_keep, d_keep)
`,

  "operators.py": `"""Kraus operator definitions and factory functions."""

import numpy as np
from .utils import PAULI_I, PAULI_X, PAULI_Y, PAULI_Z


class KrausOperator:
    def __init__(self, matrix, label=""):
        self._matrix = np.asarray(matrix, dtype=complex)
        self.label = label

    @property
    def matrix(self):
        return self._matrix

    def adjoint(self):
        return KrausOperator(self._matrix.conj().T, label=f"{self.label}\\u2020")

    def __repr__(self):
        return f"KrausOperator(label={self.label!r}, shape={self._matrix.shape})"


def validate_kraus_set(operators):
    d = operators[0].matrix.shape[0]
    total = sum(op.adjoint().matrix @ op.matrix for op in operators)
    return np.allclose(total, np.eye(d, dtype=complex))


def bit_flip_operators(p):
    return [
        KrausOperator(np.sqrt(1 - p) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p) * PAULI_X, label="E1"),
    ]


def phase_flip_operators(p):
    return [
        KrausOperator(np.sqrt(1 - p) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p) * PAULI_Z, label="E1"),
    ]


def depolarizing_operators(p):
    return [
        KrausOperator(np.sqrt(1 - 3 * p / 4) * PAULI_I, label="E0"),
        KrausOperator(np.sqrt(p / 4) * PAULI_X, label="E1"),
        KrausOperator(np.sqrt(p / 4) * PAULI_Y, label="E2"),
        KrausOperator(np.sqrt(p / 4) * PAULI_Z, label="E3"),
    ]


def amplitude_damping_operators(gamma):
    e0 = np.array([[1, 0], [0, np.sqrt(1 - gamma)]], dtype=complex)
    e1 = np.array([[0, np.sqrt(gamma)], [0, 0]], dtype=complex)
    return [
        KrausOperator(e0, label="E0"),
        KrausOperator(e1, label="E1"),
    ]
`,

  "state.py": `"""QuantumState \u2014 density-matrix representation of an n-qubit state."""

import numpy as np
from .utils import PAULI_X, PAULI_Y, PAULI_Z, partial_trace as _partial_trace

_LABEL_MAP = {
    "0": np.array([1, 0], dtype=complex),
    "1": np.array([0, 1], dtype=complex),
    "+": np.array([1, 1], dtype=complex) / np.sqrt(2),
    "-": np.array([1, -1], dtype=complex) / np.sqrt(2),
}


class QuantumState:
    def __init__(self, density_matrix):
        dm = np.asarray(density_matrix, dtype=complex)
        if dm.ndim != 2 or dm.shape[0] != dm.shape[1]:
            raise ValueError("Density matrix must be square.")
        self._matrix = dm

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

    @property
    def n_qubits(self):
        return int(np.log2(self._matrix.shape[0]))

    @property
    def matrix(self):
        return self._matrix

    def purity(self):
        return float(np.real(np.trace(self._matrix @ self._matrix)))

    def fidelity(self, other):
        sqrt_rho = _matrix_sqrt(self._matrix)
        product = sqrt_rho @ other._matrix @ sqrt_rho
        sqrt_product = _matrix_sqrt(product)
        return float(np.real(np.trace(sqrt_product)) ** 2)

    def von_neumann_entropy(self):
        eigenvalues = np.real(np.linalg.eigvalsh(self._matrix))
        eigenvalues = eigenvalues[eigenvalues > 1e-15]
        return float(-np.sum(eigenvalues * np.log2(eigenvalues)))

    def bloch_vector(self):
        if self.n_qubits != 1:
            raise ValueError("Bloch vector is only defined for single-qubit states.")
        rho = self._matrix
        x = float(np.real(np.trace(rho @ PAULI_X)))
        y = float(np.real(np.trace(rho @ PAULI_Y)))
        z = float(np.real(np.trace(rho @ PAULI_Z)))
        return [x, y, z]

    def probabilities(self):
        return np.real(np.diag(self._matrix)).tolist()

    def partial_trace(self, keep):
        dm = _partial_trace(self._matrix, keep)
        return QuantumState(dm)

    def apply(self, channel, target_qubits=None):
        return channel.apply(self, target_qubits)

    def __repr__(self):
        return f"QuantumState(n_qubits={self.n_qubits}, purity={self.purity():.4f})"


def _matrix_sqrt(m):
    eigvals, eigvecs = np.linalg.eigh(m)
    eigvals = np.maximum(eigvals, 0)
    return eigvecs @ np.diag(np.sqrt(eigvals)) @ eigvecs.conj().T
`,

  "channels.py": `"""Noise channels built on the Kraus operator formalism."""

import numpy as np
from .operators import (
    KrausOperator,
    bit_flip_operators,
    phase_flip_operators,
    depolarizing_operators,
    amplitude_damping_operators,
)
from .utils import expand_operator


class NoiseChannel:
    def __init__(self, kraus_ops, name="custom"):
        self._kraus_ops = list(kraus_ops)
        self._name = name

    @property
    def name(self):
        return self._name

    @property
    def kraus_operators(self):
        return list(self._kraus_ops)

    @property
    def n_qubits(self):
        d = self._kraus_ops[0].matrix.shape[0]
        return int(np.log2(d))

    def apply(self, state, target_qubits=None):
        from .state import QuantumState
        rho = state.matrix
        n = state.n_qubits
        if target_qubits is None:
            rho_out = np.zeros_like(rho)
            for op in self._kraus_ops:
                e = op.matrix
                rho_out += e @ rho @ e.conj().T
        else:
            rho_out = np.zeros_like(rho)
            for op in self._kraus_ops:
                e_full = op.matrix
                for t in target_qubits:
                    e_full = expand_operator(op.matrix, t, n)
                rho_out += e_full @ rho @ e_full.conj().T
        return QuantumState(rho_out)

    def compose(self, other):
        new_ops = []
        for op_b in other.kraus_operators:
            for op_a in self._kraus_ops:
                m = op_b.matrix @ op_a.matrix
                new_ops.append(KrausOperator(m, label=f"{op_b.label}\\u2218{op_a.label}"))
        return NoiseChannel(new_ops, name=f"{other.name}\\u2218{self.name}")

    def superoperator_matrix(self):
        d = self._kraus_ops[0].matrix.shape[0]
        sup = np.zeros((d * d, d * d), dtype=complex)
        for op in self._kraus_ops:
            e = op.matrix
            sup += np.kron(e, e.conj())
        return sup

    def __repr__(self):
        return f"NoiseChannel(name={self._name!r}, n_kraus={len(self._kraus_ops)})"


class BitFlip(NoiseChannel):
    def __init__(self, p):
        self.p = float(p)
        super().__init__(bit_flip_operators(self.p), name="bit-flip")


class PhaseFlip(NoiseChannel):
    def __init__(self, p):
        self.p = float(p)
        super().__init__(phase_flip_operators(self.p), name="phase-flip")


class Depolarizing(NoiseChannel):
    def __init__(self, p):
        self.p = float(p)
        super().__init__(depolarizing_operators(self.p), name="depolarizing")


class AmplitudeDamping(NoiseChannel):
    def __init__(self, gamma):
        self.gamma = float(gamma)
        super().__init__(amplitude_damping_operators(self.gamma), name="amplitude-damping")
`,

  "simulator.py": `"""Simulator \u2014 orchestrates noise channel application and parameter sweeps."""

import numpy as np
from .state import QuantumState


class Simulator:
    def run(self, state, channels):
        for channel, targets in channels:
            state = channel.apply(state, targets)
        return state

    def sweep(self, state, channel_class, values):
        values = np.asarray(values, dtype=float)
        fidelities = []
        purities = []
        entropies = []
        bloch_vectors = []
        probabilities = []
        for v in values:
            channel = channel_class(float(v))
            result = state.apply(channel)
            fidelities.append(state.fidelity(result))
            purities.append(result.purity())
            entropies.append(result.von_neumann_entropy())
            probabilities.append(result.probabilities())
            if result.n_qubits == 1:
                bloch_vectors.append(result.bloch_vector())
            else:
                bloch_vectors.append(None)
        return {
            "param_values": values.tolist(),
            "fidelities": fidelities,
            "purities": purities,
            "entropies": entropies,
            "bloch_vectors": bloch_vectors,
            "probabilities": probabilities,
        }
`,
};

/** Python bridge script — evaluated after SDK is loaded into Pyodide. */
export const BRIDGE_SCRIPT = `
import json
import numpy as np
from qnoise import QuantumState, BitFlip, PhaseFlip, Depolarizing, AmplitudeDamping, Simulator

CHANNELS = {
    "bit-flip": BitFlip,
    "phase-flip": PhaseFlip,
    "depolarizing": Depolarizing,
    "amplitude-damping": AmplitudeDamping,
}

sim = Simulator()

def _complex_to_pair(z):
    return [float(z.real), float(z.imag)]

def evaluate(channel_name, param, state_label):
    state = QuantumState.from_label(state_label)
    channel = CHANNELS[channel_name](param)
    result = state.apply(channel)
    kraus_matrices = []
    for k in channel.kraus_operators:
        rows = []
        for row in k.matrix.tolist():
            rows.append([_complex_to_pair(c) for c in row])
        kraus_matrices.append({"label": k.label, "matrix": rows})
    dm_rows = []
    for row in result.matrix.tolist():
        dm_rows.append([_complex_to_pair(c) for c in row])
    return json.dumps({
        "density_matrix": dm_rows,
        "bloch_vector": result.bloch_vector() if result.n_qubits == 1 else None,
        "probabilities": result.probabilities(),
        "purity": result.purity(),
        "fidelity": state.fidelity(result),
        "entropy": result.von_neumann_entropy(),
        "kraus_operators": kraus_matrices,
    })

def sweep(channel_name, state_label, n_points=101):
    state = QuantumState.from_label(state_label)
    channel_cls = CHANNELS[channel_name]
    values = np.linspace(0, 1, n_points)
    results = sim.sweep(state, channel_cls, values)
    return json.dumps({k: v if not hasattr(v, 'tolist') else v.tolist() for k, v in results.items()})
`;
