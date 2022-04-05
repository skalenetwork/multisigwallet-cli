#!/usr/bin/env bash


if [ $(python -V | cut -d ' ' -f 2) ] ; then
    VERSION=$(python -V | cut -d ' ' -f 2)
    MAJOR=$(echo ${VERSION::3} | cut -d '.' -f 1)
    MINOR=$(echo ${VERSION::3} | cut -d '.' -f 2)
    if [ $MAJOR = 3 ] && [ $MINOR -ge 7 ] ; then
        python -m venv venv
    else
        echo "Setup failed. Requires: Python>=3.7"
        exit 1
    fi
elif [ $(python3 -V | cut -d ' ' -f 2) ] ; then
    VERSION=$(python3 -V | cut -d ' ' -f 2)
    MAJOR=$(echo ${VERSION::3} | cut -d '.' -f 1)
    MINOR=$(echo ${VERSION::3} | cut -d '.' -f 2)
    if [ $MAJOR = 3 ] && [ $MINOR -ge 7 ] ; then
        python3 -m venv venv
    else
        echo "Setup failed. Requires: Python>=3.7"
        exit 1
    fi
else 
    echo "Setup failed. Install: Python>=3.7"
    exit 1
fi

source venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/generate_abi.py
wget -O ./data/ima_mainnet.json https://raw.githubusercontent.com/skalenetwork/skale-network/master/releases/mainnet/IMA/1.1.0/abi.json
