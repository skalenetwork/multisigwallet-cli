# MultiSigWallet CLI

## Setup

Clone repo, run `yarn install` and setup `.env`

Optional variables:
- `PRIVATE_KEY_<number>` - Owner of the wallet, where `<number>` should be less or equal 50
- `ABI` - Filename of the custom abi, must be in `data/` folder


## CLI Usage

### Global options
- `-a, --account <number>` - Account number from which the transaction should be performed, by default it's 1. The account is associated with a private key in `.env`
- `--custom` - For custom abi, set filepath to ABI into `.env`


### EncodeData

Returns encoded data for interaction with schain through gnosis safe on mainnet.

```bash
npx msig encodeData [options] <schainName> <contract> <func> [params...]
```

Required arguments:
-  `<schainName>` - Destination schain name
-  `<contract>` -   Destination contract that you wanna call
-  `<func>` -       Function that you wanna call on the destination contract

Optional arguments:
-  `[params...]` -     Arguments for the destination function

### Call

Returns the result of executing the transaction, using call.

```bash
npx msig call [options] <contract> <func> [params...]
```

Required arguments:
-  `<contract>` -   Destination contract that you wanna call
-  `<func>` -       Function that you wanna call on the destination contract

Optional arguments:
-  `[params...]` -     Arguments for the destination function


### Recharge
```bash
npx msig recharge [options] <amount>
```

Allows to recharge the balance of the MultiSigWallet contract

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<amount>` -     Amount of money in wei

### SubmitTransaction

Allows an owner to submit and confirm a transaction. `<contract>` must be written in `PascalCase`. `<func>` must be written in `camelCase` and function parameters must be written separated by spaces.

```bash
npx msig submitTransaction [options] <contract> <func> [params...]
```

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:

-   `<contract>` - Name of the contract in pascal case
-   `<func>` - Name of the function that you wanna call on the destination 
contract

Optional arguments:
-   `[params...]` - Arguments for the destination function

Usage example:
```bash
npx msig submitTransaction DepoymentController addToWhitelist <ethereum-address>
```

### SubmitTransactionWithData
```bash
npx msig submitTransactionWithData [options] <contractAddress> <data>
```

Allows an owner to submit and confirm a transaction with custom data.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<contractAddress>` -  Destination contract that you wanna call
-  `<data>` -             Encoded data of function selector and params

### ConfirmTransaction
```bash
npx msig confirmTransaction [options] <transactionId>
```

Allows an owner to confirm a transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<transactionId>` - Transaction id


### RevokeConfirmation
```bash
npx msig revokeConfirmation [options] <transactionId>
```

Allows an owner to revoke a confirmation for a transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<transactionId>` - Transaction id


### ExecuteTransaction
```bash
npx msig executeTransaction [options] <transactionId>
```

Allows you to execute a confirmed transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<transactionId>` - Transaction id


### GetConfirmations
```bash
npx msig getConfirmations [options] <transactionId>
```

Returns array with owner addresses, which confirmed transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<transactionId>` - Transaction id


### GetConfirmationCount
```bash
npx msig getConfirmationCount [options] <transactionId>
```

Returns number of confirmations of a transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
-  `<transactionId>` - Transaction id


### IsConfirmed
```bash
npx msig isConfirmed [options] <transactionId>
```

Returns the confirmation status of transactions. If transaction ID was provided, than execution will return only status for that transaction.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Optional arguments:
-  `[transactionId]` - Transaction id

### GetOwners
```bash
npx msig getOwners [options]
```

Returns list of owners.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

### GetBalance
```bash
npx msig getBalance [options]
```

Returns the balance of address.

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Required arguments:
- `<address>` -     The address of which you wanna know the balance













