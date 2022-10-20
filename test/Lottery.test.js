const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' })
});

describe('Lottery Contract', () => {
    // 1 - Testa se pubblica il contratto
    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    });

    // 2 - Testa se un giocatore riesce ad entrare nel contratto
    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        // 2.1 Testa se ri riesce a recuperare l'array di giocatori
        // giocatore giusto
        // numero giusto
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    // 3 - Testa se più giocatori riescono ad entrare nel contratto
    it('allows multiple account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        // 3.1 Testa se ri riesce a recuperare l'array di giocatori
        // giocatore giusto
        // numero giusto
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    // 4 - Testa se il contratto impedisce di entrare a che paga meno del minimo
    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: '200' // 200 wei < 0.01 eth
            });
            assert(false); // eseguita solo se l'istruzione precedente non genera errori -> se si arriva qui il test è fallito
        } catch (err) {
            assert(err); // verifica che ci sia un errore -> se c'è il test ha avuto successo
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner.send({
                from: accounts[1]
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    })
});