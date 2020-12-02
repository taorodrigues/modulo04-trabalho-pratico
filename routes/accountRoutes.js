import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

app.get('/account', async (req, res) => {
  const account = await accountModel.find({});

  try {
    res.send(account);
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * ATIVIDADE 4 - Crie um endpoint para registrar um depósito em uma conta. Este endpoint deverá receber como parâmetros a “agencia”, o número da conta e o valor do depósito.
 * Ele deverá atualizar o “balance” da conta, incrementando-o com o valor recebido como parâmetro. O endpoint deverá validar se a conta informada existe, caso não exista deverá retornar um erro, caso exista retornar o saldo atual da conta.
 */
app.patch('/depositarDinheiroEmConta', async (req, res, next) => {
  try {
    const { conta, agencia, value } = req.body;
    console.log('Recebido da requisicao ' + JSON.stringify(req.body));

    const data = await accountModel.findOneAndUpdate(
      { conta, agencia },
      { $inc: { balance: value } },
      { new: true }
    );

    console.log(data);

    if (!data) {
      throw new Error('Conta nao encontrada.');
    }

    res.send({ balance: data.balance });
  } catch (err) {
    next(err);
  }
});

/**
 * ATIVIDADE 5 - Crie um endpoint para registrar um saque em uma conta. Este  endpoint deverá receber como parâmetros a “agência”, o número da conta e o  valor do saque.
 * Ele deverá atualizar o “balance” da conta, decrementando-o com o valor recebido como parâmetro e cobrando uma tarifa de saque de (1).
 * O endpoint deverá validar se a conta informada existe, caso não exista deverá retornar um erro, caso exista retornar o saldo atual da conta.
 * Também deverá validar se a conta possui saldo suficiente para aquele saque, se não tiver deverá retornar um erro, não permitindo assim que o saque fique  negativo.
 */

app.patch('/saque', async (req, res, next) => {
  try {
    let { conta, agencia, value } = req.body;
    value++; //cobra a tarifa de saque de (1)

    if (value > 0) {
      value = -1 * value;
    }

    const accountRecovered = await accountModel.findOne({ conta, agencia });

    console.log(JSON.stringify(accountRecovered));

    if (!accountRecovered) {
      throw new Error('Conta nao encontrada.');
    }
    if (accountRecovered.balance + value < 0) {
      throw new Error(`Saldo Insuficiente: ${accountRecovered.balance}`);
    }

    const response = await accountModel.findOneAndUpdate(
      {
        agencia,
        conta,
      },
      { $inc: { balance: value } },
      { new: true }
    );

    res.send({ balance: response.balance });
  } catch (err) {
    next(err);
  }
});

/**
 * ATIVIDADE 6 - Crie um endpoint para consultar o saldo da conta. Este endpoint deverá receber como parâmetro a “agência” e o número da conta, e deverá retornar seu “balance”.
 * Caso a conta informada não exista, retornar um erro
 */
app.get('/saldo/:agencia/:conta', async (req, res, next) => {
  try {
    console.log(JSON.stringify(req.params));
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    const accountRecovered = await accountModel.findOne({ conta, agencia });

    console.log(JSON.stringify(accountRecovered));

    if (!accountRecovered) {
      throw new Error('Conta nao encontrada.');
    }

    res.send({ balance: accountRecovered.balance });
  } catch (err) {
    next(err);
  }
});

/**
 * ATIVIDADE 7 - Crie um endpoint para excluir uma conta. Este endpoint deverá receber como parâmetro a “agência” e o número da conta e retornar o número de contas ativas para esta agência.
 */
app.delete('/:agencia/:conta', async (req, res) => {
  try {
    console.log(JSON.stringify(req.params));
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    const accountDeleted = await accountModel.deleteOne({ agencia, conta });
    console.log(JSON.stringify(accountDeleted));

    const count = await accountModel.countDocuments({ agencia });
    const accounts = await accountModel.find({});

    res.send({ count: count, accounts: [...accounts] });
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * ATIVIDADE 8 - Crie um endpoint para realizar transferências entre contas.Este endpoint deverá receber como parâmetro o número da “conta” origem, o número da “conta” destino e o valor de transferência.
 * Este endpoint deve validar se as contas são da mesma agência para realizar a transferência, caso seja de agências distintas o valor de tarifa de transferência (8) deve ser debitado na conta origem.
 * O endpoint deverá retornar o saldo da conta origem.
 */
app.patch('/transferencia', async (req, res, next) => {
  try {
    let { contaOrigem, contaDestino, valor } = req.body;
    console.log('Recebido da requisicao ' + JSON.stringify(req.body));

    const sourceAccount = await accountModel.findOne({ conta: contaOrigem });
    console.log(`Conta ORIGEM ${JSON.stringify(sourceAccount)}`);

    if (!sourceAccount) {
      throw new Error('Conta ORIGEM nao encontrada.');
    }

    const targetAccount = await accountModel.findOne({ conta: contaDestino });
    console.log(`Conta DESTINO ${JSON.stringify(targetAccount)}`);

    if (!targetAccount) {
      throw new Error('Conta DESTINO nao encontrada.');
    }

    if (sourceAccount.agencia !== targetAccount.agencia) valor = valor + 8;

    let valorADebitar = -1 * valor;

    const sourceAccountUpdated = await accountModel.findOneAndUpdate(
      {
        conta: contaOrigem,
      },
      { $inc: { balance: valorADebitar } },
      { new: true }
    );

    const targetAccountUpdated = await accountModel.findOneAndUpdate(
      {
        conta: contaDestino,
      },
      { $inc: { balance: valor } },
      { new: true }
    );

    res.send({ balance: sourceAccountUpdated.balance });
  } catch (err) {
    next(err);
  }
});

/**
 * ATIVIDADE 9 - Crie um endpoint para consultar a média do saldo dos clientes de determinada agência.
 *  O endpoint deverá receber como parâmetro a “agência” e deverá retornar
o balance médio da conta.
 */
app.get('/media/:agencia', async (req, res, next) => {
  try {
    const { agencia } = req.params;

    const result = await accountModel.aggregate([
      {
        $match: { agencia: +agencia },
      },
      {
        $group: {
          _id: -1,
          balanceAvg: { $avg: '$balance' },
        },
      },
    ]);

    console.log(JSON.stringify(result));

    if (result.length === 0) {
      throw new Error('AGENCIA INVALIDA.');
    }
    const balanceAvg = result[0].balanceAvg;

    res.send({ media: balanceAvg });
  } catch (err) {
    next(err);
  }
});

/**
 * ATIVIDADE 10 - Crie um endpoint para consultar os clientes com o menor saldo em conta.
 * O endpoint deverá receber como parâmetro um valor numérico para determinar a quantidade de clientes a serem listados, e o endpoint deverá retornar em ordem crescente pelo saldo a lista dos clientes (agência, conta, saldo).
 */
app.get('/contasComMenoresValores/:quantidadeClientes', async (req, res) => {
  try {
    const { quantidadeClientes } = req.params;

    if (!quantidadeClientes) {
      res.status(500).send('QUANTIDADE INVALIDA');
      throw new Error('QUANTIDADE INVALIDA');
    }

    const accounts = await accountModel
      .find({}, { _id: 0, name: 0, lastModified: 0 })
      .sort({ balance: 1 })
      .limit(+quantidadeClientes);

    if (accounts.length === 0 || !accounts) {
      res.status(500).send('NENHUMA CONTA ENCONTRADA');
      throw new Error('NENHUMA CONTA ENCONTRADA');
    }

    res.send(accounts);
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * 11. Crie um endpoint para consultar os clientes mais ricos do banco.
 * O endpoint deverá receber como parâmetro um valor numérico para determinar a quantidade de clientes a serem listados, e o endpoint deverá retornar em ordem decrescente pelo saldo, crescente pelo nome, a lista dos clientes (agência, conta, nome e saldo).
 */

app.get(
  '/contasComMaioresValores/:quantidadeClientes',
  async (req, res, next) => {
    try {
      const { quantidadeClientes } = req.params;

      if (!quantidadeClientes) {
        throw new Error('QUANTIDADE INVALIDA');
      }

      const accounts = await accountModel
        .find({}, { _id: 0, lastModified: 0 })
        .sort({ balance: -1, name: 1 })
        .limit(+quantidadeClientes);

      if (accounts.length === 0 || !accounts) {
        throw new Error('NENHUMA CONTA ENCONTRADA');
      }

      res.send(accounts);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 12. Crie um endpoint que irá transferir o cliente com maior saldo em conta de cada agência para a agência private agencia=99.
 * O endpoint deverá retornar a lista dos clientes da agencia private.
 */
app.get('/transferirClientesParaPrivateAgencia', async (req, res, next) => {
  try {
    const accounts = await accountModel.aggregate([
      {
        $sort: { balance: -1 },
      },
      {
        $group: {
          _id: '$agencia',
          id: { $first: '$_id' },
          name: { $first: '$name' },
          agencia: { $first: '$agencia' },
          conta: { $first: '$conta' },
          balance: { $first: '$balance' },
        },
      },
    ]);

    console.log(JSON.stringify(accounts));

    accounts.forEach(async (account) => {
      await accountModel.findOneAndUpdate(
        { _id: account.id },
        {
          $set: {
            agencia: 99,
          },
        }
      );
    });
    const accountsOfPrivateAggency = await accountModel.find({ agencia: 99 });

    res.send(accountsOfPrivateAggency);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(400).send({ error: err.message });
});

export { app as accountRouter };
