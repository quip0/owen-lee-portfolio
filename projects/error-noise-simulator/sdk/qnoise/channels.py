"""Noise channels built on the Kraus operator formalism."""

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
    """Base noise channel: ρ → Σ_k E_k ρ E_k†."""

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
            # apply to all qubits (channel must match state dimension)
            rho_out = np.zeros_like(rho)
            for op in self._kraus_ops:
                e = op.matrix
                rho_out += e @ rho @ e.conj().T
        else:
            # expand each Kraus op to the full Hilbert space
            rho_out = np.zeros_like(rho)
            for op in self._kraus_ops:
                e_full = op.matrix
                for t in target_qubits:
                    e_full = expand_operator(op.matrix, t, n)
                rho_out += e_full @ rho @ e_full.conj().T

        return QuantumState(rho_out)

    def compose(self, other):
        """Compose two channels: apply self then other."""
        new_ops = []
        for op_b in other.kraus_operators:
            for op_a in self._kraus_ops:
                m = op_b.matrix @ op_a.matrix
                new_ops.append(KrausOperator(m, label=f"{op_b.label}∘{op_a.label}"))
        return NoiseChannel(new_ops, name=f"{other.name}∘{self.name}")

    def superoperator_matrix(self):
        """Liouville (superoperator) representation."""
        d = self._kraus_ops[0].matrix.shape[0]
        sup = np.zeros((d * d, d * d), dtype=complex)
        for op in self._kraus_ops:
            e = op.matrix
            sup += np.kron(e, e.conj())
        return sup

    def __repr__(self):
        return f"NoiseChannel(name={self._name!r}, n_kraus={len(self._kraus_ops)})"


# ── Concrete channels ──────────────────────────────────────────

class BitFlip(NoiseChannel):
    """Bit-flip channel with probability p."""

    def __init__(self, p):
        self.p = float(p)
        super().__init__(bit_flip_operators(self.p), name="bit-flip")


class PhaseFlip(NoiseChannel):
    """Phase-flip channel with probability p."""

    def __init__(self, p):
        self.p = float(p)
        super().__init__(phase_flip_operators(self.p), name="phase-flip")


class Depolarizing(NoiseChannel):
    """Depolarizing channel with probability p."""

    def __init__(self, p):
        self.p = float(p)
        super().__init__(depolarizing_operators(self.p), name="depolarizing")


class AmplitudeDamping(NoiseChannel):
    """Amplitude-damping channel with damping parameter γ."""

    def __init__(self, gamma):
        self.gamma = float(gamma)
        super().__init__(amplitude_damping_operators(self.gamma), name="amplitude-damping")
