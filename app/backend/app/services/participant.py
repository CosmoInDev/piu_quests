from typing import Literal

ParticipantStatus = Literal["FINISHED", "SUBMITTING", "UNSUBMITTED"]


def derive_status(submitted: int, total: int) -> ParticipantStatus:
    """Derive participant status from photo submission counts."""
    if submitted == 0:
        return "UNSUBMITTED"
    if submitted >= total:
        return "FINISHED"
    return "SUBMITTING"
