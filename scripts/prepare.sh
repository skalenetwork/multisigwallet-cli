#!/usr/bin/env bash


function _create_venv {
    ls /usr/bin/python* | grep "python$1" > /dev/null
    if [ $? = 0 ] ; then
        python$1 -m venv venv
    fi
}

versions=('3.7' '3.8' '3.9' '3.10')

for version in ${versions[@]}
do
    _create_venv $version
done

if [ ! -d "venv/" ] ; then
    echo "Setup failed. Unsupported version Python."
    exit 1
fi

source venv/bin/activate
python3 -m pip install wheel
python3 -m pip install -r scripts/requirements.txt
python3 scripts/generate_abi.py
git clone https://github.com/skalenetwork/skale-network.git
STABLE_IMA_VERSION=$(ls skale-network/releases/mainnet/IMA/ | sort -r | head -n 1)
cp skale-network/releases/mainnet/IMA/$STABLE_IMA_VERSION/mainnet/abi.json data/ima_mainnet.json
rm -r --interactive=never skale-network/
