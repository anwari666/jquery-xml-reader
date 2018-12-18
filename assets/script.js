// IIFE - to encapsulate the javascript
(function($, moment){
    
    var feeds = [];
    var feedUrl = 'https://www.engadget.com/rss-full.xml';
    var $FeedItemTemplate = $('#rss-item-template');
    var $NewFeedTemplate = $('#new-feedreader');
    var $feedHeaderTemplate = $('#rss-item-heading');
    var $loadingTemplate = $('#loading-feed');
    var $errorFeedTemplate = $('#error-feed');
    var $feedsContainer = $('#feed-reader-container');

    // The FeedReader constructor to initiate new object when called.
    // Every instance inherits prototypal inheritance
    var FeedReader = function(url, callback){
        this.id         = Date.now();
        this.url        = url || false;
        this.callback   = callback || function(){ };
        this.num        = 10;
        this.colorID    = (feeds.length % 6) + 1;
        // Since engadget's server does not come with X-ORIGIN REQUEST POLICY, then 
        // I'm using a service from feedrapp that provide such service
        this.serviceName= 'www.feedrapp.info';
        this.$htmlContainer = $('<div id="rss-items-container-' 
                                    + this.id 
                                    + '" class="rss-items-container col-12 col-md-6 mb-4">\
                                        <div class="m-1 p-3 bg-white rounded shadow-lg"></div>\
                                    </div>');

        
        if (url) { this.loadFeed() } 
            else { this.create() } 
        
        this.renderContainer();
    }

    FeedReader.prototype.create = function(){
        var _this = this;

        this.$NewFeedTemplate = $NewFeedTemplate.clone();

        this.$NewFeedTemplate
                .find('form')
                .on('submit', function(e){ e.preventDefault(); _this.url = _this.$NewFeedTemplate.find('#feed-url').val(); _this.loadFeed() } )
                .on('click', '#cancel-feed', function(e){ e.preventDefault(); _this.destroy() } ); // !!

        this.render( this.$NewFeedTemplate );
    }

    FeedReader.prototype.destroy = function(){
        var _this = this;
        this.$htmlContainer.addClass('mySlideOutLeft');

        setTimeout(function(){ 
            _this.$htmlContainer.remove(); 
            feeds.pop(); // !warning `feeds` is mutated
            (feeds.length <= 2) && $feedsContainer.children().removeClass('col-xl-4');
        }, 1000);
        
    }

    FeedReader.prototype.formatNewFeedTemplate = function(){
        // this.$htmlContainer.html( $NewFeedTemplate.clone() );
    }

    // put the whole thing into the DOM.
    FeedReader.prototype.renderContainer = function(){

        this.$htmlContainer.addClass('color_'+ this.colorID);

        if ( feeds.length >= 2 ) {
            $feedsContainer.children().addClass('col-xl-4')
            this.$htmlContainer.addClass('col-xl-4')
        }

        $feedsContainer.prepend( this.$htmlContainer.addClass('animated mySlideInLeft') );
    }

    FeedReader.prototype.fetch = function(callback){
        var encodedRssUri = encodeURIComponent(this.url);
        var jsonUrl =   'https://' + this.serviceName + 
                        '?callback=?&q=' + encodedRssUri + 
                        '&num=' + this.num;

        this.render( $loadingTemplate.clone() );

        $.getJSON(jsonUrl, callback);
    }

    FeedReader.prototype.loadFeed = function(){
        var _this = this;
        
        try {
            this.fetch( function(data){
                
                if ( data.responseData.feed === null ) {
                    _this.renderError();
                    return;
                }

                _this.feed = Object.assign({}, data.responseData.feed);
                _this.entries = Object.assign({}, data.responseData.feed.entries);
                
                var header = _this.formatHeader(),
                    entries = _this.formatEntries();
    
                _this.render( [header].concat(entries) );
            })
        } 
        catch (e) {
                console.log("Error.");
        }
    }

    FeedReader.prototype.formatEntries = function(){
        var elements = [];
        var $temp;
        var _this = this;

        $.each(this.entries, function(key, item){
            var entry = $.extend( {}, item, {number : parseInt(key) + 1} );

            $temp = _this.formatEntry(entry);
            elements.push($temp);
        });

        return elements;
    }

    // Format a single entry. 
    // Better use templating engine like Mustache for better readability
    FeedReader.prototype.formatEntry = function(entry){
        var $entryTemplate = $FeedItemTemplate.clone();

        // find the items and replace with respective attribute
        $entryTemplate.attr( 'id', 'rss-'+ this.id + '-item-' + entry.number );
        $entryTemplate.find('.number').text( entry.number );
        $entryTemplate.find('.item-title').text( entry.title );
        $entryTemplate.find('.excerpt').text(  this.generateExcerpt( entry.content ) );
        $entryTemplate.find('.readmore').prop( 'href', entry.link ).attr('title', entry.title );
        $entryTemplate.find('.author').text( entry.author && ' | ' + entry.author );
        $entryTemplate.find('.published-date').text( this.formatPublishedDate( entry.publishedDate ) );
        $entryTemplate.css('display', 'inherit');

        return $entryTemplate;
    }


    // Format the header. Ideally with RSS info like the name, desc, etc.
    FeedReader.prototype.formatHeader = function(){
        this.$header = $feedHeaderTemplate.clone();
        this.$header.text( this.feed.title );        

        return this.$header;
    }

    FeedReader.prototype.renderError = function(){
        var _this = this;
        this.$errorFeed = $errorFeedTemplate.clone();
        this.$errorFeed
            .find('.close-feed')
            .click(function(e){ e.preventDefault()
                    _this.destroy();
            });
        this.render( this.$errorFeed );
    }

    FeedReader.prototype.render = function( $item ){
        this.$htmlContainer.find('.bg-white').html( $item )
    }

    FeedReader.prototype.refresh = function(){
        // reload new things
        // diff it
        // add new items into view + new notif.
    }

    FeedReader.prototype.formatPublishedDate = function(utcString){
        return moment( utcString ).fromNow();
    }

    FeedReader.prototype.generateExcerpt = function( contentString ){
        return htmlDecode( contentString )
                .split('')
                .slice(0, 100)
                .join('') 
                + '...';
    }

    // a utility function to decode HTML entities
    function htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }

    function bindEvents() {
        $('#add-new-feed').on('click', function(e){
            var reader = new FeedReader();
            feeds.push( reader );
        });
    }

    // Main function.
    function main(){
        bindEvents();

        var engadget = new FeedReader(feedUrl, null);
        feeds.push(engadget);

        // var aljazeera = new FeedReader('https://www.aljazeera.com/xml/rss/all.xml', null).render();
        // new FeedReader('https://www.theonion.com/rss', null).render();
        // https://www.dailymail.co.uk/articles.rss
        // https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
    }

    main();

})(jQuery, moment);