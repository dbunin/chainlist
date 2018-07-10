const ChainList = artifacts.require('./ChainList.sol')

contract('ChainList', accounts => {
    var chainListInstace
    var seller = accounts[1]
    var buyer = accounts[2]
    var articleName1 = 'Article 1'
    var articleDescription1 = 'Description for article 1'
    var articlePrice1 = 1
    var articleName2 = 'Article 2'
    var articleDescription2 = 'Description for article 2'
    var articlePrice2 = 2
    var sellerBalanceBeforeBuy, sellerBalanceAfterBuy
    var buyerBalanceBeforeBuy, buyerBalanceAfterBuy

    it('should be initialized with empty values', () =>
        ChainList.deployed().then(instance => {
            chainListInstace = instance
            return chainListInstace.getNumberOfArticles()
        }).then(data => {
            assert.equal(data.toNumber(), 0, 'Number of articles should be 0')
            return chainListInstace.getArticlesForSale()
        }).then(data => {
            assert.equal(data.length, 0, 'there shouldnt be any article for sale')
        })
    )

    it('should sell first article', () =>
        ChainList.deployed().then(instance => {
            chainListInstace = instance
            return chainListInstace.sellArticle(
                articleName1, articleDescription1,
                web3.toWei(articlePrice1, 'ether'), {from: seller}
            )
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered')
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'The event shoul dbe correct')
            assert.equal(receipt.logs[0].args._id.toNumber(), 1, 'the id must be 0')
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller)
            assert.equal(receipt.logs[0].args._name, articleName1, 'article name must be ' + articleName1)
            assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, 'ether'), 'price must be ' + articlePrice1)
            return chainListInstace.getNumberOfArticles()
        }).then(data => {
            assert.equal(data, 1, 'number of articles must be one')
            return chainListInstace.getArticlesForSale()
        }).then(data => {
            assert.equal(data.length, 1, 'there must be one article for sale')
            assert.equal(data[0].toNumber(), 1, 'article id must be 1')
            return chainListInstace.articles(data[0])
        }).then(data => {
            assert.equal(data[0].toNumber(), 1, 'article id must be 1')
            assert.equal(data[1], seller, 'seller must be ' + seller)
            assert.equal(data[2], 0x0, 'buyer must be empty')
            assert.equal(data[3], articleName1, 'article name must be ' + articleName1)
            assert.equal(data[4], articleDescription1, 'article description must be ' + articleDescription1)
            assert.equal(data[5].toNumber(), web3.toWei(articlePrice1, 'ether'), 'article price must be ' + articlePrice1)
        })
    )

    it('should sell second article', () =>
        ChainList.deployed().then(instance => {
            chainListInstace = instance
            return chainListInstace.sellArticle(
                articleName2, articleDescription2,
                web3.toWei(articlePrice2, 'ether'), {from: seller}
            )
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered')
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'The event shoul dbe correct')
            assert.equal(receipt.logs[0].args._id.toNumber(), 2, 'the id must be 0')
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller)
            assert.equal(receipt.logs[0].args._name, articleName2, 'article name must be ' + articleName2)
            assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice2, 'ether'), 'price must be ' + articlePrice2)
            return chainListInstace.getNumberOfArticles()
        }).then(data => {
            assert.equal(data, 2, 'number of articles must be two')
            return chainListInstace.getArticlesForSale()
        }).then(data => {
            assert.equal(data.length, 2, 'there must be two articles for sale')
            assert.equal(data[1].toNumber(), 2, 'article id must be 1')
            return chainListInstace.articles(data[1])
        }).then(data => {
            assert.equal(data[0].toNumber(), 2, 'article id must be 1')
            assert.equal(data[1], seller, 'seller must be ' + seller)
            assert.equal(data[2], 0x0, 'buyer must be empty')
            assert.equal(data[3], articleName2, 'article name must be ' + articleName2)
            assert.equal(data[4], articleDescription2, 'article description must be ' + articleDescription2)
            assert.equal(data[5].toNumber(), web3.toWei(articlePrice2, 'ether'), 'article price must be ' + articlePrice2)
        })
    )

    it('should buy first article', () =>
        ChainList.deployed().then(instance => {
            chainListInstace = instance
            sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber()
            buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber()
            return chainListInstace.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice1, 'ether')})
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered')
            assert.equal(receipt.logs[0].event, 'LogBuyArticle', 'The event should be correct')
            assert.equal(receipt.logs[0].args._id.toNumber(), 1, "article id must be 1")
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller)
            assert.equal(receipt.logs[0].args._buyer, buyer, 'event buyer must be ' + buyer)
            assert.equal(receipt.logs[0].args._name, articleName1, 'article name must be ' + articleName1)
            assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, 'ether'), 'price must be ' + articlePrice1)
            sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber()
            buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber()

            // keep gas in mind
            assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1, 'seller should have earned ' + articlePrice1 + ' ETH')
            assert(sellerBalanceAfterBuy <= sellerBalanceBeforeBuy + articlePrice1, 'buyer should have spent ' + articlePrice1 + ' ETH and gas')

            return chainListInstace.getArticlesForSale()
        }).then(data => {
            assert.equal(data.length, 1, 'there should be only one artifact left for sale')
            assert.equal(data[0].toNumber(), 2, 'article 2 should be the only article left for sale')
            return chainListInstace.getNumberOfArticles()
        }).then(data => assert.equal(data.toNumber(), 2, 'there should still be two articles in total'))
    )
})