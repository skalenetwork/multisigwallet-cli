#!/usr/bin/env bash

python3 -m venv venv
source venv/bin/activate
pip install -r scripts/requirements.txt
python3 scripts/generate_abi.py