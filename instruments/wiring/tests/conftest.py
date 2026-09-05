"""conftest.py — cert-machine's own, not a port.

The tests import `lattice_claims` as a package beside them. Run as frontier runs
them (`cd instruments/wiring && python3 -m pytest tests`), the cwd puts the
package on sys.path. The control build runs every battery from the repository
root, and there pytest puts THIS directory on the path, not its parent — both
rows came back RED with ModuleNotFoundError on the first control build after
the port, and the runner's new habit of printing a red battery's last lines is
what made that readable. One line closes it for every invocation."""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
