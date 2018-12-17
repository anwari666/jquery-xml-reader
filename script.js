// IIFE - to encapsulate the javascript
(function($, moment){
    
    var feeds = [];
    var feedUrl = 'https://www.engadget.com/rss-full.xml';
    var $FeedItemTemplate = $('#rss-item-template');
    var $NewFeedTemplate = $('#new-feedreader');
    var $loadingTemplate = $('#loading-feed');
    var $feedsContainer = $('#feed-reader-container');

    var FeedReader = function(url, callback){
        this.id         = Date.now();
        this.url        = url || false;
        this.callback   = callback || function(){ };
        this.num        = 10;
        // Since engadget's server does not come with X-ORIGIN REQUEST POLICY, then 
        // I'm using a service from feedrapp that provide such service
        this.serviceName= 'www.feedrapp.info';
        this.$htmlContainer = $('<div id="rss-items-container-' 
                                    + this.id 
                                    + '" class="rss-items-container col-12 col-md-6 col-xl-4 my-3 p-3 bg-white rounded shadow-sm">');

        // logic to render the container + create new
        

        if (url) { this.loadFeed() } 
        else { this.create() } 
        
        this.renderContainer();
    }

    FeedReader.prototype.create = function(){
        var _this = this;

        this.$NewFeedTemplate = $NewFeedTemplate.clone();

        this.$NewFeedTemplate
                .on('click', '#load-feed', function(e){ alert('coi') } )
                .on('click', '#cancel-feed', function(e){_this.destroy()} ); // !!

        this.render( this.$NewFeedTemplate );
    }

    FeedReader.prototype.destroy = function(){
        this.$htmlContainer.remove();
        // need to remove from feeds as well.
    }

    FeedReader.prototype.formatNewFeedTemplate = function(){
        // this.$htmlContainer.html( $NewFeedTemplate.clone() );
    }

    // put the whole thing into the DOM.
    FeedReader.prototype.renderContainer = function(){
        $feedsContainer.prepend( this.$htmlContainer );
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
                _this.feed = Object.assign({}, data.responseData.feed);
                _this.entries = Object.assign({}, data.responseData.feed.entries);
                
                var header = _this.formatHeader(),
                    entries = _this.formatEntries();
    
                _this.render( [header].concat(entries) );
            })
        } 
        catch (e) {
                console.log("Error cuy.");
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
        $entryTemplate.find('.published-date').text( this.formatPublishedDate( entry.publishedDate ) );
        $entryTemplate.css('display', 'inherit');

        return $entryTemplate;
    }


    // Format the header. Ideally with RSS info like the name, desc, etc.
    FeedReader.prototype.formatHeader = function(){
        return $('<h4 class="pb-6 mb-0">' + this.feed.title + '</h4>');
    }


    FeedReader.prototype.render = function( $item ){
        this.$htmlContainer.html( $item )
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

    // a utility funciton to decode HTML entities
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

    // Main function
    function main(){
        bindEvents();

        var engadget = new FeedReader(feedUrl, null);
        feeds.push(engadget);

        // var aljazeera = new FeedReader('https://www.aljazeera.com/xml/rss/all.xml', null).render();

        // feeds.push(aljazeera);
        // new FeedReader('https://www.theonion.com/rss', null).render();
    }

    main();

})(jQuery, moment);