#!/usr/bin/env bash

python3 -m venv venv
source venv/bin/activate
pip install -r scripts/requirements.txt
python3 scripts/generate_abi.py
wget -O ./data/ima_mainnet.json https://raw.githubusercontent.com/skalenetwork/skale-network/master/releases/mainnet/IMA/1.1.0/abi.json