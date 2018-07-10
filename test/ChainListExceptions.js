const ChainList = artifacts.require('./ChainList.sol')

contract('ChainList', accounts => {
    var chainListInstance
    var seller = accounts[1]
    var buyer = accounts[2]
    var articleName = 'article 1'
    var articleDescription = 'description for article 1'
    var articlePrice = 10

    it('should throw no article for sale', () =>
        ChainList.deployed().then(instance => {
            chainListInstance = instance
            return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice, 'ether')})
        }).then(assert.fail)
        .catch(error => assert(true))
        .then(() => chainListInstance.getNumberOfArticles())
        .then(data => 
            assert.equal(data.toNumber(), 0, 'Number of articles must be 0')
        )
    )

    it('should throw when trying to buy an article that does not exist', () =>
        ChainList.deployed().then(instance =>{
            chainListInstance = instance
            return chainListInstance.sellArticle(
                articleName, articleDescription,
                web3.toWei(articlePrice, 'ether'), {from: seller})
        }).then(receipt => chainListInstance.buyArticle(2,{from: seller, value: web3.toWei(articlePrice, 'ether')}))
        .then(assert.fail)
        .catch(error => assert(true))
        .then(() => chainListInstance.articles(1))
        .then(data => assert.equal(data[0].toNumber(), 1, 'Article id should be equal to 1'))
    )

    it('should throw exception when buying your own article', () => 
        ChainList.deployed().then(instance => {
            chainListInstance = instance
            return chainListInstance.buyArticle(1, {from: seller, value: web3.toWei(articlePrice, 'ether')})
        }).then(assert.fail)
        .catch(error => assert(true))
        .then(() => chainListInstance.articles(1))
        .then(data => assert.equal(data[2], 0x0, 'buyer must be empty'))
    )

    it('should throw exception when price is wrong', () =>
        ChainList.deployed().then(instance => {
            chainListInstance = instance
            return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(1, 'ether')})
        }).then(assert.fail)
        .catch(error => assert(true))
        .then(() => chainListInstance.articles(1))
        .then(data => assert.equal(data[2], 0x0, 'buyer must be empty'))
    )

    it('should throw exception when buying sold article', () =>
        ChainList.deployed().then(instance => {
            chainListInstance = instance
            return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice, 'ether')})
        }).then(() =>
            chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice, 'ether')})
        ).then(assert.fail)
        .catch(error => assert(true))
        .then(() => chainListInstance.articles(1))
        .then(data => assert.equal(data[2], buyer, 'buyer must be ' + buyer))
    )
})