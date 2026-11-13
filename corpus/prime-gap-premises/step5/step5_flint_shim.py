# Step 5, OUR environment shim (no byte of the package changes). The package's worker puts its bundled macOS build of
# python-flint first on sys.path; on Linux that build cannot load. This finder resolves the top-level module `flint`
# from THIS environment's site-packages instead (python-flint 0.9.0 built here against FLINT 3.6.0 + 7ad753d5).
import importlib.machinery, os, sys
_SP = os.path.dirname(os.path.abspath(__file__))
class _FlintFromThisEnvironment:
    @staticmethod
    def find_spec(name, path=None, target=None):
        if name == 'flint':
            return importlib.machinery.PathFinder.find_spec(name, [_SP])
        return None
sys.meta_path.insert(0, _FlintFromThisEnvironment)
