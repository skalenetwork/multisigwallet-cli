#!/usr/bin/env python3

import os
import json
from pkg_resources import resource_stream
from marionette_predeployed import  MARIONETTE_ADDRESS
from multisigwallet_predeployed import  MULTISIGWALLET_ADDRESS


def generate_abi():
    multisigwallet_json = resource_stream('multisigwallet_predeployed', 'artifacts/MultiSigWallet.json').read().decode()
    multisigwallet_abi = json.loads(multisigwallet_json)['abi']
    marionette_json = resource_stream('marionette_predeployed', 'artifacts/Marionette.json').read().decode()
    marionette_abi = json.loads(marionette_json)['abi']
    abi = {
        'marionette_address': MARIONETTE_ADDRESS,
        'marionette_abi': marionette_abi,
        'multisigwallet_address': MULTISIGWALLET_ADDRESS,
        'multisigwallet_abi': multisigwallet_abi
    }
    abi_filename = os.path.join(os.path.dirname(__file__), '../data/predeployed.json')
    with open(abi_filename, 'w') as f:
        json.dump(abi, f)

def main():
    generate_abi()


if __name__ == '__main__':
    main()
