# MultiSigWallet CLI

## Setup

Clone repo, run `yarn install` and setup `.env`

Required variables:
- `ENDPOINT` - Endpoint of the SKALE chain
- `PRIVATE_KEY_1` - Originatior private key (owner of the MultiSigWallet)

Optional variables:
- `PRIVATE_KEY_<number>` - Owner of the wallet, where `<number>` should be less or equal 50
- `ABI` - Filename of the custom abi, must be in `data/` folder


## CLI Usage

### Global options
- `-a, --account <number>` - Account number from which the transaction should be performed, by default it's 1. The account is associated with a private key in `.env`
- `--custom` - For custom abi, set filepath to ABI into `.env`

### SubmitTransaction

Allows an owner to submit and confirm a transaction. `<contract>` must be written in `PascalCase`. `<func>` must be written in `camelCase` and function parameters must be written separated by spaces.

```bash
npx msig submitTransaction [options] <contract> <func> <params...>
```

Required arguments:

-   `<contract>` - Name of the contract in pascal case
-   `<func>` - Name of the function that you wanna call on the destination contract
-   `<params...>` - Arguments for the destination function

Usage example:
```bash
npx msig submitTransaction DepoymentController addToWhitelist <ethereum-address>
```

### EncodeData

Returns encoded data for interaction with schain through gnosis safe on mainnet.

```bash
npx msig encodeData [options] <schainName> <contract> <func> <params...>
```

Required arguments:
-  `<schainName>` - Destination schain name
-  `<contract>` -   Destination contract that you wanna call
-  `<func>` -       Function that you wanna call on the destination contract
-  `<params>` -     Arguments for the destination function


### Recharge
```bash
npx msig recharge [options] <amount>
```

Allows to recharge the balance of the MultiSigWallet contract

Arguments:
-  `<amount>` -     Amount of money in wei


### SubmitTransactionWithData
```bash
npx msig submitTransactionWithData [options] <contractAddress> <data>
```

Allows an owner to submit and confirm a transaction with custom data.

Arguments:
-  `<contractAddress>` -  Destination contract that you wanna call
-  `<data>` -             Encoded data of function selector and params

### ConfirmTransaction
```bash
npx msig confirmTransaction [options] <transactionId>
```

Allows an owner to confirm a transaction.

Arguments:
-  `<transactionId>` - Transaction id


### RevokeConfirmation
```bash
npx msig revokeConfirmation [options] <transactionId>
```

Allows an owner to revoke a confirmation for a transaction.

Arguments:
-  `<transactionId>` - Transaction id


### ExecuteTransaction
```bash
npx msig executeTransaction [options] <transactionId>
```

Allows you to execute a confirmed transaction.

Arguments:
-  `<transactionId>` - Transaction id


### GetConfirmations
```bash
npx msig getConfirmations [options] <transactionId>
```

Returns array with owner addresses, which confirmed transaction.

Arguments:
-  `<transactionId>` - Transaction id


### GetConfirmationCount
```bash
npx msig getConfirmationCount [options] <transactionId>
```

Returns number of confirmations of a transaction.

Arguments:
-  `<transactionId>` - Transaction id


### IsConfirmed
```bash
npx msig isConfirmed [options] <transactionId>
```

Returns the confirmation status of transactions. If transaction ID was provided, than execution will return only status for that transaction.

Optional arguments:
-  `[transactionId]` - Transaction id

### GetOwners
```bash
npx msig getOwners [options]
```

Returns list of owners.

### GetBalance
```bash
npx msig getBalance [options]
```

Returns the balance of address.

Arguments:
- `<address>` -     The address of which you wanna know the balance












