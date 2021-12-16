#!/usr/bin/env python3

import os
import json
from multisigwallet_predeployed import  MultiSigWalletGenerator, MULTISIGWALLET_ADDRESS
from marionette_predeployed import  UpgradeableMarionetteGenerator, MARIONETTE_ADDRESS, MARIONETTE_IMPLEMENTATION_ADDRESS

ORIGINATOR_ADDRESS = '0x77A26beF106bCcf4CAB41723736aa0206f94fe4B'
PROXY_ADMIN_ADDRESS = '0xd200000000000000000000000000000000000000'
MAINNET_OWNER_ADDRESS = '0xd200000000000000000000000000000000000001'
SCHAIN_OWNER_ADDRESS = MULTISIGWALLET_ADDRESS
MESSAGE_PROXY_FOR_SCHAIN_ADDRESS = '0xd200000000000000000000000000000000000003'

multisigwallet_generator = MultiSigWalletGenerator()
marionette_generator = UpgradeableMarionetteGenerator()

# MULTISIGWALLET_ADDRESS = '0xD244519000000000000000000000000000000000'
# MARIONETTE_ADDRESS = '0xD2c0DeFACe000000000000000000000000000000'

genesis = {
    **multisigwallet_generator.generate_allocation(
        contract_address=MULTISIGWALLET_ADDRESS,
        originator_addresses=[ORIGINATOR_ADDRESS]
    ),
    **marionette_generator.generate_allocation(
        contract_address=MARIONETTE_ADDRESS,
        implementation_address=MARIONETTE_IMPLEMENTATION_ADDRESS,            
        proxy_admin_address=PROXY_ADMIN_ADDRESS,
        schain_owner=MAINNET_OWNER_ADDRESS,
        marionette=MARIONETTE_ADDRESS,
        owner=SCHAIN_OWNER_ADDRESS,
        ima=MESSAGE_PROXY_FOR_SCHAIN_ADDRESS,
    )
}


def generate_genesis(allocations: dict = {}):
    base_genesis_filename = os.path.join(os.path.dirname(__file__), '../genesis/base_genesis.json')
    with open(base_genesis_filename) as base_genesis_file:
        genesis = json.load(base_genesis_file)
        genesis['alloc'].update(allocations)

    genesis_filename = os.path.join(os.path.dirname(__file__), '../genesis/genesis.json')
    with open(genesis_filename, 'w') as f:
        json.dump(genesis, f)


def main():
    generate_genesis(genesis)


if __name__ == '__main__':
    main()