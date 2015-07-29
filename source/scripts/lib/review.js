/**
 * jQuery ReVIEW
 * An ultra lightweight jQuery / Zepto plugin for lazy loading elements
 * https://github.com/resrcit/ReVIEW
 *
 * Licensed under the MIT license.
 * Copyright 2013 Dominic Fee
 * http://www.resrc.it
 */

(function ($) {
    $.fn.review = function () {
        var options = $.extend({threshold: 0, callback: function () {
            }}, arguments[0] || {}),
            $w = $(window),
            th = options.threshold,
            element = this,
            inView,
            isElementInView;
        this.one("reviewElement", function () {
            options.callback.call(this);
        });
        function reviewElement() {
            isElementInView = element.filter(function () {

                /**
                 * Hat tip to https://github.com/luis-almeida/unveil
                 * for adapting his inview window calculations
                 */

                var $e = $(this),
                    wo = $w.offset() ? $w.offset().top : 0,
                    wlo = $w.offset() ? $w.offset().left : 0,
                    wt = $w.scrollTop() + wo,
                    wlt = $w.scrollLeft() + wlo,
                    wb = wt + $w.height(),
                    wlb = wlt + $w.width(),
                    et = $e.offset().top,
                    el = $e.offset().left,
                    eb = et + $e.height(),
                    elb = el + $e.width();
                return eb >= wt - th && et <= wb + th && elb >= wlt - th && el <= wlb + th;
            });
            inView = isElementInView.trigger("reviewElement");
            element = element.not(inView);
        }

        $w.scroll(reviewElement);
        $w.resize(reviewElement);
        reviewElement();
        return this;
    };
})(window.jQuery || window.Zepto); 