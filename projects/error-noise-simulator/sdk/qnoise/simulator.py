"""Simulator — orchestrates noise channel application and parameter sweeps."""

import numpy as np
from .state import QuantumState


class Simulator:
    """Applies sequences of noise channels and runs parameter sweeps."""

    def run(self, state, channels):
        """Apply a sequence of (channel, target_qubits) pairs to a state.

        Parameters
        ----------
        state : QuantumState
        channels : list[tuple[NoiseChannel, list[int] | None]]

        Returns
        -------
        QuantumState
        """
        for channel, targets in channels:
            state = channel.apply(state, targets)
        return state

    def sweep(self, state, channel_class, values):
        """Sweep a channel parameter from *values[0]* to *values[-1]*.

        Parameters
        ----------
        state : QuantumState
            Initial state (same for every point).
        channel_class : type
            One of BitFlip, PhaseFlip, Depolarizing, AmplitudeDamping.
        values : array-like
            Parameter values to sweep over.

        Returns
        -------
        dict with keys:
            param_values, fidelities, purities, entropies,
            bloch_vectors (list of [x,y,z] or None), probabilities
        """
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
