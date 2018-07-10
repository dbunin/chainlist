App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,
    init: () => App.initWeb3(),

    initWeb3: () => {
        // initialize web3
        if(typeof web3 !== 'undefined'){
            // reuse he provider of the web3 object
            App.web3Provider = web3.currentProvider
        } else{
            // create new provider and plug it directly to localnode
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')
        }
        web3 = new Web3(App.web3Provider)
        App.displayAccountInfo()
        return App.initContract()
    },

    displayAccountInfo: () => {
        web3.eth.getCoinbase((err, account) => {
            if(err === null){
                App.account = account
                $('#account').text(account)
                web3.eth.getBalance(account, (err, balance) => {
                    if(err === null){
                        $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH")
                    }
                })
            }
        })
    },

    initContract: () => {
        $.getJSON('ChainList.json', chainListArtifact => {
            App.contracts.ChainList = TruffleContract(chainListArtifact)
            // connect contract with provider
            App.contracts.ChainList.setProvider(App.web3Provider)
            // listen to events
            App.listenToEvents()
            // retrieve the article from the contract
            return App.reloadArticles()
        })
    },

    reloadArticles: () => {
        // refresh account information
        App.displayAccountInfo()
        // retrieve the article placeholder and clear it
        $('#articlesRow').empty()
        App.contracts.ChainList.deployed()
        .then(instance => instance.getArticle())
        .then(article => {
            if(article[0] == 0x0){
                // no article to display
                return
            }
            var price = web3.fromWei(article[4], 'ether')
            // retrieve article template and fill it with data
            var articleTemplate = $('#articleTemplate')
            articleTemplate.find('.panel-title').text(article[2])
            articleTemplate.find('.article-description').text(article[3])
            articleTemplate.find('.article-price').text(price)
            articleTemplate.find('.btn-buy').attr('data-value', price)
            var seller = article[0]
            if(seller === App.account){
                seller = 'You'
            }
            articleTemplate.find('.article-seller').text(seller)
            var buyer = article[1]
            if(buyer == App.account){
                buyer = "You"
            }
            else if(buyer == 0x0){
                buyer = "Noone yet"
            }
            articleTemplate.find('.article-buyer').text(buyer)
            if(article[0] === App.account || article[1] != 0x0){
                articleTemplate.find('.btn-buy').hide()
            }
            else{
                articleTemplate.find('.btn-buy').show()
            }
            // add this article
            $('#articlesRow').append(articleTemplate.html())
        }).catch(error => console.log(error))
    },

    sellArticle: () => {
        //retrieve the details or an article
        var _article_name = $('#article_name').val()
        var _description = $('#article_description').val()
        var _price = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether')
        if((_article_name.trim() === '') || (_price === 0)){
            return false
        }
        App.contracts.ChainList.deployed().then(instance => {
            return instance.sellArticle(_article_name, _description, _price, {
                from: App.account,
                gas: 500000
            })
        }).catch(error => console.log(err))
    },

    buyArticle: () => {
        event.preventDefault()
        // get article price
        var _price = parseFloat($(event.target).data('value'))
        App.contracts.ChainList.deployed()
        .then(instance => instance.buyArticle({from: App.account, value: web3.toWei(_price, 'ether'), gas: 60000}))
        .catch(error => console.error(error))
    },

    // listen to events triggered by the contract
    listenToEvents: () => {
        App.contracts.ChainList.deployed().then(instance => {
            instance.LogSellArticle({}, {}).watch((error, event) => {
                if(!error){
                    $('#events').append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>')
                }else{
                    console.log(error)
                }
                App.reloadArticles()
            })
            instance.LogBuyArticle({}, {}).watch((error, event) => {
                if(!error){
                    $('#events').append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>')
                }else{
                    console.log(error)
                }
                App.reloadArticles()
            })
        })
    },
}

$(() => $(window).load(()  => App.init()))
