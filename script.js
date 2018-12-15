// IIFE - to encapsulate the javascript
(function($, moment){
    
    var feedUrl = 'https://www.engadget.com/rss-full.xml';
    var $rssItemTemplate = $('#rss-item-template');

    var FeedReader = function(target, url, callback){
        this.target     = target;
        this.url        = url;
        this.callback   = callback || function(){ };
        this.num        = 10;
        // Since engadget's server does not come with X-ORIGIN REQUEST POLICY, then 
        // I'm using a service from feedrapp that provide such service
        this.serviceName= 'www.feedrapp.info'; 
    }

    FeedReader.prototype.load = function(callback){
        var encodedRssUri = encodeURIComponent(this.url);
        var jsonUrl =   'https://' + this.serviceName + 
                        '?callback=?&q=' + encodedRssUri + 
                        '&num=' + this.num;

        $.getJSON(jsonUrl, callback);
    }

    FeedReader.prototype.render = function(){
        var _this = this;
        
        try {
            this.load(function(data){
                _this.feed = Object.assign({}, data.responseData.feed);
                _this.entries = Object.assign({}, data.responseData.feed.entries);
                
                // _this.callback(entries);
                var html = _this.formatFeed();
                $('.rss-items-container').html(html); // more like append
                // console.log(feed, entries)
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
        var $entryTemplate = $rssItemTemplate.clone();

        $img = $( entry.content ).find('img')[0];

        // find the items and replace with respective attribute
        $entryTemplate.attr( 'id', 'rss-item-' + entry.number );
        $entryTemplate.find('.number').text( entry.number );
        $entryTemplate.find('.item-title').text( entry.title );
        // $entryTemplate.find('.content-snippet').text( entry.contentSnippet + '...' );
        $entryTemplate.find('.excerpt').text(  this.generateExcerpt( entry.content ) );
        $entryTemplate.find('.readmore').prop( 'href', entry.link );
        $entryTemplate.find('.published-date').text( this.formatPublishedDate( entry.publishedDate ) );
        $entryTemplate.css('display', 'inherit');

        return $entryTemplate;
    }


    // Format the header. Ideally with RSS info like the name, desc, etc.
    FeedReader.prototype.formatHeader = function(){
        return $('<h4 class="pb-6 mb-0">' + this.feed.title + '</h4>');
    }

    // Return the FeedHeader and FeedEntries
    FeedReader.prototype.formatFeed = function(){
        var header = this.formatHeader(),
            entries = this.formatEntries();

        return new Array().concat([ header ], entries);
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
        return $( contentString.trim() )
                .text()
                .replace(/\s+/g, ' ')
                .split('')
                .slice(0, 100)
                .join('') 
                + '...';
    }

    new FeedReader('', feedUrl, null).render();

})(jQuery, moment);