/**[ TIME ]*******************************************************************/
(function() {
    var dts   = $$(".timeago")
      , index = dts.length
      , _fmts = { seconds: "less than a minute"
                , minutes: ["about a minute", "#{num} minutes"]
                , hours:   ["about an hour",  "#{num} hours"]
                , days:    ["about a day",    "#{num} days"]
                , months:  ["about a month",  "#{num} months"]
                , years:   ["about a year",   "#{num} years"]
                , concat:  [", ", " and "]
                , suffix:  " ago" }
      , date, el

    // formats the given date component according to the desc format
    function get_format(comp, val, cap, min, max) {
        function fmt(index) {
            val = cap ? val % cap : val
            return desc[index].interpolate({num: val}) }

        var desc = _fmts[comp]
        if (!Object.isArray(desc)) desc = [desc, desc]

        val = ~~val
        if (null != min && val && val <= min) return fmt(0)
        if (null != max && val && val <= max) return fmt(1)
        return ""
    }

    // Joins a sequence of date descs
    function join(seq) {
        var i    = seq.length
          , seps = _fmts["concat"]
          , rv   = ""
          , sep  = ""
        if (!Object.isArray(seps)) seps = [seps]

        while (i--) {
            if (seq[i]) {
                rv += sep + seq[i]
                if (seps.length) sep = seps.pop() }}
        return rv
    }

    // returns how older is a date, as a string
    function get_time_ago(date) {
        var tdiff = new Date() - date
          , sec   = tdiff / 1000
          , min   = sec / 60
          , hours = min / 60
          , days  = hours / 24
          , mon   = days / 30
          , years = days / 365

        return join([get_format("seconds", sec,   60, 59)
                    ,get_format("minutes", min,   60, 1, 100)
                    ,get_format("hours",   hours, 24, 1, 48)
                    ,get_format("days",    days,  30, 1, 60)
                    ,get_format("months",  mon,   12, 1, 24)
                    ,get_format("years",   years,  0, 1)])
               + _fmts["suffix"]
    }
    Date.prototype.getTimeAgo = function(){ return get_time_ago(this) }

    while (index--) {
        date = new Date(dts[index].getAttribute("datetime"))
        el   = new Element("span", {"class": "meta-timeago"})
        el.insert("(" + date.getTimeAgo() + ")")
        dts[index].insert(el) }
})();

/**[ TWITTER ]****************************************************************/
var Twitter = (function(){
    // parses the weird data format Twitter uses
    function parse_date(date) {
        var comps = date.split(" ")
        return [comps[0], ",", comps[2], comps[1], comps[5]
               ,comps[3], "GMT"+comps[4]].join(" ")
    }

    function renderTweets(data) {
        var cur, time_ago, hashtags, replies, links, text, meta, usr_reply
        function search_str(s) {
            return "<a href='http://twitter.com/search?q=" + escape(s) + "'>"
                 + s + "</a>" }

        function add_reply_to() {
            var name = cur.in_reply_to_screen_name
            meta += " in reply to <a href='http://twitter.com/" + name + "'>"
                  + name + "</a>" }

        function add_reply_btn() {
            var name = cur.user.screen_name
            meta += " &#0151; <a class='reply' href='http://twitter.com/"
                  + "?status=@" + name + "&in_reply_to_status_id="
                  + cur.id_str + "&in_reply_to=" + name
                  + "'>reply</a></div></li>" }

        function add_source() { meta += " from " + cur.source }

        usr_reply = "<a href='http://twitter.com/$1'>$&</a>" // user reply
        hashtags  = /(#[a-z_\-]+)/gim
        replies   = /\@([a-z_\-]+)/gim
        links     = /((https?|ftp|gopher|telnet|file|notes|ms-help):((\/\/)|(\\\\\\?))+[\w\d:#@%\/;$()~_?\+-=\\\.&]*)/gim

        if (data.length > 0) {
            cur      = data[0]
            time_ago = new Date(parse_date(cur.created_at)).getTimeAgo()
            text     = cur.text.replace(links,    "<a href='$&'>$&</a>")
                               .replace(hashtags, search_str)
                               .replace(replies,  usr_reply)

            document.getElementById("tweet").innerHTML = text

            meta = "<a href='http://twitter.com/" + cur.user.screen_name
                  + "/status/" + cur.id_str + "'>" + time_ago + "</a>"

            if (cur.source)                  add_source()
            if (cur.in_reply_to_screen_name) add_reply_to()

            add_reply_btn()
            document.getElementById("tweet-info").innerHTML = meta }
    }

    return { renderTweets: renderTweets }
})();


/**[ DISQUS ]*****************************************************************/
var disqus_shortname = 'quildreen';
(function () {
    var s = document.createElement('script')

    s.async = true
    s.type  = 'text/javascript'
    s.src   = 'http://' + disqus_shortname + '.disqus.com/count.js';

    (document.getElementsByTagName('HEAD')[0]
     || document.getElementsByTagName('BODY')[0]).appendChild(s)
}());
