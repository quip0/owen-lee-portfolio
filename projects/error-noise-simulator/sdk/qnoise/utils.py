"""Shared math helpers and Pauli matrices."""

import numpy as np

# ── Pauli matrices ──────────────────────────────────────────────

PAULI_I = np.eye(2, dtype=complex)
PAULI_X = np.array([[0, 1], [1, 0]], dtype=complex)
PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
PAULI_Z = np.array([[1, 0], [0, -1]], dtype=complex)


def tensor(*matrices):
    """Kronecker (tensor) product of one or more matrices."""
    result = matrices[0]
    for m in matrices[1:]:
        result = np.kron(result, m)
    return result


def expand_operator(op, target, n_qubits):
    """Embed a single-qubit operator into an n-qubit Hilbert space.

    Parameters
    ----------
    op : ndarray (2×2)
        Single-qubit operator.
    target : int
        Index of the target qubit (0-indexed, qubit 0 is the most significant).
    n_qubits : int
        Total number of qubits.

    Returns
    -------
    ndarray (2^n × 2^n)
    """
    parts = [PAULI_I] * n_qubits
    parts[target] = op
    return tensor(*parts)


def partial_trace(rho, keep, dims=None):
    """Trace out all subsystems except those listed in *keep*.

    Parameters
    ----------
    rho : ndarray
        Full density matrix.
    keep : list[int]
        Indices of subsystems to keep (0-indexed).
    dims : list[int] | None
        Dimensions of each subsystem.  Defaults to all-qubit (dim 2).
    """
    n = int(np.log2(rho.shape[0]))
    if dims is None:
        dims = [2] * n

    keep = sorted(keep)
    trace_out = sorted(set(range(n)) - set(keep))

    rho_tensor = rho.reshape(dims + dims)

    for i, idx in enumerate(trace_out):
        # after each trace the number of axes shrinks
        ax1 = idx - i
        ax2 = ax1 + (n - i)
        rho_tensor = np.trace(rho_tensor, axis1=ax1, axis2=ax2)

    d_keep = int(np.prod([dims[k] for k in keep]))
    return rho_tensor.reshape(d_keep, d_keep)
