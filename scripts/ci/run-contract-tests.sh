#!/usr/bin/env bash

# Run every Python contract test through unittest discovery.  Keeping the
# collection check here prevents a missing tests/__init__.py (or an import
# failure) from turning CI into a successful no-op.

set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
cd "$ROOT_DIR"

expected=$(find tests -type f -name 'test_*.py' -print | wc -l | tr -d '[:space:]')
if [ "$expected" -eq 0 ]; then
  echo "::error::no tests/test_*.py modules found"
  exit 1
fi

collected=$(python3 -c '
import unittest

suite = unittest.defaultTestLoader.discover("tests", top_level_dir=".")
modules = set()

def walk(item):
    if isinstance(item, unittest.TestSuite):
        for child in item:
            walk(child)
    else:
        modules.add(type(item).__module__)

walk(suite)
print(len(modules))
')

if [ "$collected" -ne "$expected" ]; then
  echo "::error::discovery collected ${collected} of ${expected} test modules"
  echo "::error::a test module failed to import or tests/__init__.py is missing"
  exit 1
fi

echo "Running ${collected} contract test modules"
exec python3 -m unittest discover \
  --start-directory tests \
  --top-level-directory . \
  --verbose
