#!/usr/bin/env python3

import os
import re
import json
import sys
from pkg_resources import resource_stream
from marionette_predeployed import MARIONETTE_ADDRESS
from multisigwallet_predeployed import MULTISIGWALLET_ADDRESS
from etherbase_predeployed import ETHERBASE_ADDRESS
from filestorage_predeployed import FILESTORAGE_ADDRESS
from config_controller_predeployed import CONFIG_CONTROLLER_ADDRESS
from ima_predeployed.addresses import PROXY_ADMIN_ADDRESS, \
                            MESSAGE_PROXY_FOR_SCHAIN_ADDRESS, \
                            KEY_STORAGE_ADDRESS, \
                            ETH_ERC20_ADDRESS, \
                            COMMUNITY_LOCKER_ADDRESS, \
                            TOKEN_MANAGER_ETH_ADDRESS, \
                            TOKEN_MANAGER_ERC20_ADDRESS, \
                            TOKEN_MANAGER_ERC721_ADDRESS, \
                            TOKEN_MANAGER_ERC1155_ADDRESS, \
                            TOKEN_MANAGER_LINKER_ADDRESS, \
                            TOKEN_MANAGER_ERC721_WITH_METADATA_ADDRESS


resources = {
    'ima_predeployed': {
        'ProxyAdmin': PROXY_ADMIN_ADDRESS,
        'MessageProxyForSchain': MESSAGE_PROXY_FOR_SCHAIN_ADDRESS,
        'KeyStorage': KEY_STORAGE_ADDRESS,
        'CommunityLocker': COMMUNITY_LOCKER_ADDRESS,
        'EthErc20': ETH_ERC20_ADDRESS,
        'TokenManagerEth': TOKEN_MANAGER_ETH_ADDRESS,
        'TokenManagerERC20': TOKEN_MANAGER_ERC20_ADDRESS,
        'TokenManagerERC721': TOKEN_MANAGER_ERC721_ADDRESS,
        'TokenManagerERC1155': TOKEN_MANAGER_ERC1155_ADDRESS,
        'TokenManagerLinker': TOKEN_MANAGER_LINKER_ADDRESS,
        'TokenManagerERC721WithMetadata': TOKEN_MANAGER_ERC721_WITH_METADATA_ADDRESS
    },
    'marionette_predeployed': {
        'Marionette': MARIONETTE_ADDRESS,
    },
    'multisigwallet_predeployed': {
        'MultiSigWallet': MULTISIGWALLET_ADDRESS,
    },
    'etherbase_predeployed': {
        'Etherbase': ETHERBASE_ADDRESS,
    },
    'filestorage_predeployed': {
        'FileStorage': FILESTORAGE_ADDRESS,
    },
    'config_controller_predeployed': {
        'ConfigController': CONFIG_CONTROLLER_ADDRESS
    }
}

def camel_to_snake_case(contract_name):
    return re.sub(r'(?<!^)(?=[A-Z])', '_', contract_name).lower()

    
def generate_abi():
    abi = {}
    for package, contracts in resources.items():
        for contract_name in contracts:
            contract_address = contracts[contract_name]
            snake_contract_name = camel_to_snake_case(contract_name)
            contract_json = resource_stream(package, f'artifacts/{contract_name}.json').read().decode()
            contract_abi = json.loads(contract_json)['abi']
            abi[snake_contract_name + '_address'] = contract_address
            abi[snake_contract_name + '_abi'] = contract_abi
        
    abi_filename = os.path.join(os.path.dirname(__file__), '../data/predeployed.json')
    with open(abi_filename, 'w') as f:
        json.dump(abi, f)

def main():
    generate_abi()


if __name__ == '__main__':
    main()
