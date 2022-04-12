#!/usr/bin/env bash


function _create_venv {
    ls /usr/bin/python* | grep "python$1" > /dev/null
    if [ $? = 0 ] ; then
        python$1 -m venv venv
    fi
}

versions=('3.7' '3.9' '3.8' '3.10')

for version in ${versions[@]}
do
    _create_venv $version
done

if [ ! -d "venv/" ] ; then
    echo "Setup failed. Unsupported version Python."
    exit 1
fi

source venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/generate_abi.py
wget -O ./data/ima_mainnet.json https://raw.githubusercontent.com/skalenetwork/skale-network/master/releases/mainnet/IMA/1.1.0/abi.json
