(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var store = require('store');
var Notify = require('notifyjs');
var md5 = require('blueimp-md5');
var hbs = window.Handlebars;
var w = window;
var $ = window.jQuery || window.Zepto;

var $body = $('body');
var $html = $('html');

function onShowNotification() {
  console.log('notification is shown!');
}

function onCloseNotification() {
  console.log('notification is closed!');
}

function onClickNotification() {
  console.log('notification was clicked!');
}

function onErrorNotification() {
  console.error('Error showing notification. ' +
  'You may need to request permission.');
}

function onPermissionGranted() {
  console.log('Permission has been granted by the user');
  doNotification('你要捏代码已经复制到剪贴板，粘去吧 ^_^');
}

function onPermissionDenied() {
  console.warn('Permission has been denied by the user');
}

function doNotification(msg) {
  var myNotification = new Notify('嗨，骚年!', {
    body: msg,
    tag: 'amazeUI',
    icon: '/i/app-icon72x72@2x.png',
    notifyShow: onShowNotification,
    notifyClose: onCloseNotification,
    notifyClick: onClickNotification,
    notifyError: onErrorNotification,
    timeout: 3
  });

  myNotification.show();
}

var initDuosuo = function() {
  w.duoshuoQuery = {
    short_name: 'amui'
  };

  var $duoshuo = $('<script></script>', {
    charset: 'utf-8',
    src: (document.location.protocol === 'https:' ?
      'https:' : 'http:') + '//static.duoshuo.com/embed.js'
  });

  $body.append($duoshuo);
};

$(window).on('load', function() {
  $('.ds-thread').length && initDuosuo();
});

var amaze = {};

amaze.auth = function() {
  var $auth = $('.auth');
  var $user = $auth.find('#username');
  var $avatar = $auth.find('#user-avatar');

  $user.on('blur', function() {
    var hash = md5($(this).val());
    $avatar.attr('src',
      'http://www.gravatar.com/avatar/' + hash + '?d=mm&s=144');
  });
};

amaze.externalLink = function() {
  var $doc = $('.doc-content');
  var $exLink = $doc.find('a[href^="http://"], a[href^="https://"]').
    not('.doc-example a');
  $exLink.addClass('external-link').attr('target', '_blank');
};

amaze.checkLogin = function() {
  var storeEnabled = store && store.enabled;
  var $header = $('#amz-header');
  var $profile = $header.find('.nav-profile.need-check');
  var $avatar = $profile.find('img');
  var loggedInStatusKey = '_amui_login_status';
  var now = new Date().getTime();

  if (storeEnabled) {
    var localData = store.get(loggedInStatusKey);
    if (localData) {
      if (w.location.search.indexOf('logout') > -1) {
        store.remove(loggedInStatusKey);
        $profile.hide();
        return;
      }

      if ((now - localData.lastCheck) < 3600000) {
        $avatar.attr('src', localData.avatar);
        $profile.show().addClass('am-animation-fade');
        return;
      } else {
        store.remove(loggedInStatusKey);
      }
    }
  }

  $.getJSON('/api/user', function(data) {
    if (data.loggedIn) {
      $profile.show();
      $avatar.attr('src', data.avatar);
      data.lastCheck = new Date().getTime();
      storeEnabled && store.set(loggedInStatusKey, data);
    } else {
      $profile.hide();
    }
  });
};

amaze.zeroClip = function() {
  if (!window.ZeroClipboard) {
    return;
  }

  ZeroClipboard.config({
    moviePath: '/js/ZeroClipboard.swf',
    hoverClass: 'doc-act-clip-hover'
  });

  var copyBtn = '<div class="doc-actions"><div class="doc-act-inner">' +
    '<span class="doc-act-clip am-icon-copy"> Copy</span></div></div>';
  var copyBtnNew = '<div class="doc-actions"><div class="doc-act-inner">' +
    '<span class="doc-act-newwin am-icon-file-code-o"> New Win</span>' +
    '<span class="doc-act-clip am-icon-copy"> Copy</span></div></div>';

  $('.doc-code').each(function() {
    var $code = $(this);
    var $prev = $code.prev();

    if ($prev.hasClass('doc-example')) {
      if ($prev.attr('data-url')) {
        $prev.before(copyBtnNew);
      } else {
        $prev.before(copyBtn);
      }
    } else {
      $code.before(copyBtn);
    }
  });

  $('.doc-act-newwin').on('click', function(e) {
    var $demo = $(this).parent().parent('.doc-actions').next('.doc-example');
    if ($demo.length && $demo.attr('data-url')) {
      window.open($demo.attr('data-url'), '',
        'width=320px, height=480px, centerscreen=yes');
    }
  });

  var codeClip = new ZeroClipboard($('.doc-act-clip'));

  codeClip.on('ready', function(readyEvent) {
    codeClip.on('copy', function(e) {
      var $next = $(e.target).parent().parent().next();
      var $reqCode = $next.is('.doc-code') ? $next : $next.next('.doc-code');
      e.clipboardData.setData('text/plain', $reqCode.text());
    });
  });

  // Copy finish
  codeClip.on('aftercopy', function(e) {
    if (Notify.needsPermission) {
      Notify.requestPermission(onPermissionGranted, onPermissionDenied);
    } else {
      doNotification('你要捏代码已经复制到剪贴板，粘去吧 ^_^');
    }
    if (console) {
      console.log('Copied text to clipboard: ' + e.data['text/plain']);
    }
  });

  // Can't copy
  codeClip.on('error', function(e) {
    if (Notify.needsPermission) {
      Notify.requestPermission(onPermissionGranted, onPermissionDenied);
    } else {
      doNotification('Something wrong :-(\n' + e.name);
    }
  });

  // Copy example
  // Read: https://github.com/zeroclipboard/zeroclipboard/blob/1.x-master/docs/instructions.md
};

amaze.toolbar = function() {
  var $w = $(w);
  var $toolbar = $('#amz-toolbar');
  var $goTop = $toolbar.find('#amz-go-top');

  if (!$goTop.length) {
    return;
  }

  $goTop.on('click', function(e) {
    e.preventDefault();
    $(w).smoothScroll(0);
  });

  function checkScrollTop() {
    if ($w.scrollTop() > 10) {
      $goTop.addClass('am-active');
    } else {
      $goTop.removeClass('am-active');
    }
  }

  function checkWinWidth() {
    if ($w.width() > 1110) {
      $toolbar.css({right: ($w.width() - 1110) / 2});
    } else {
      $toolbar.css({right: '10px'});
    }
  }

  checkScrollTop();

  checkWinWidth();

  $w.on('scroll', $.AMUI.utils.debounce(checkScrollTop, 100));
  $w.on('resize', $.AMUI.utils.debounce(checkWinWidth, 100));
};

amaze.standaloneMode = function() {
  if (window.navigator.standalone) { // WebApp Mode
    $(document).on('click', 'a', function(e) {
      var link = $(this).attr('href');
      if (link && (link.indexOf('http') || ~link.indexOf(location.host))) {
        e.preventDefault();
        location.href = link;
      }
    });
  }
};

amaze.pageChange = function() {
  var animationSupported = $.AMUI.support.animation;
  var $bd = $('body');

  if (animationSupported) {
    $(document).on('click', 'a', function(e) {
      var link = $(this).attr('href');
      if (link && (link.indexOf('http') || ~link.indexOf(location.host))) {
        e.preventDefault();
        $bd.addClass('doc-slide-out');
        $bd.one(animationSupported.end, function() {
          location.href = link;
        });
      }
    });

    $bd.addClass('doc-slide-in');
    $bd.one(animationSupported.end, function() {
      $bd.removeClass('doc-slide-in');
    });
  }
};

amaze.getIssues = function() {
  var issues = 'https://api.github.com/repos/allmobilize/amazeui/issues?state=all&labels=';
  var $main = $('#amz-main');
  var component = $main.attr('data-tag');
  var $tpl = $main.find('#issue-list-tpl');
  var $issueList = $main.find('#issue-list');
  var source = $tpl.text() || '';
  var template = hbs && hbs.compile(source);

  if (component && template) {
    $.getJSON(issues + component, function(data) {
      data && data.length && $issueList.html(template(data));
    });
  }
};

amaze.sticky = function() {
  var $bar = $('#amz-offcanvas');
  var $pager = $bar.find('.amz-pager');
  var $pagerLink = $pager.find('a');
  var $sidebar = $bar.find('.amz-sidebar');

  $bar.sticky({
    top: 10,
    bottom: function() {
      return $('.amz-footer').height() + 25;
    },
    media: 641
  });

  function barMaxHeight() {
    var $footer = $('.amz-footer');
    // jQuery height() 返回的值不包含 padding 和 border
    var footerHeight = $footer[$.fn.outerHeight ? 'outerHeight' : 'height']();
    var h = $(w).height() - 20 - footerHeight;
    if ($bar.hasClass('am-sticky')) {
      $sidebar.css({'max-height': h});
      $bar.css({'max-height': h});
    } else {
      $sidebar.css({'max-height': ''});
      $bar.css({'max-height': ''});
    }

    if (h > $sidebar.height()) {
      $pager.removeClass('am-active');
    } else {
      $pager.addClass('am-active');
    }

    $pager.css({top: $sidebar.height() / 2});
  }

  barMaxHeight();

  setTimeout(barMaxHeight, 119);

  $(w).on('scroll resize', $.AMUI.utils.debounce(barMaxHeight, 10));

  $pager.on('click', 'a', function(e) {
    e.preventDefault();
    if ($(this).hasClass('am-disabled')) {
      return;
    }

    var data = $(this).data('rel');
    var scrollTop = $sidebar.scrollTop();
    var delta = 200;

    if (data === 'scrollUp') {
      $sidebar.smoothScroll({position: scrollTop - delta});
    } else {
      $sidebar.smoothScroll({position: scrollTop + delta});
    }
  });

  function checkScroll() {
    var disabled = 'am-disabled';

    if ($sidebar.scrollTop() === 0) {
      $pagerLink.eq(0).addClass(disabled);
    } else {
      $pagerLink.eq(0).removeClass(disabled);
    }
    // TODO: 滚动到底部判断
  }

  $sidebar.on('scroll', $.AMUI.utils.debounce(checkScroll, 50));

  // http://stackoverflow.com/questions/7154967/jquery-detect-scrolldown
  // IE, Opera, Safari
  $sidebar.on('mousewheel', function(e) {
    e.preventDefault();
    var direction = e.wheelDelta < 0 ? 'down' : 'up';
    mouseScroll(direction);
  }).on('DOMMouseScroll', function(e) { // Firefox
    e.preventDefault();
    mouseScroll(e.detail > 0 ? 'down' : 'up');
  });

  function mouseScroll(direction, delta) {
    direction = direction || 'up';
    delta = delta || 100;
    var scrollTo = (direction === 'up' ?
        -delta : delta) + $sidebar.scrollTop();

    $sidebar.scrollTop(scrollTo);
  }
};

amaze.docToc = function() {
  var $toc = $('.doc-toc-bd > .md-toc');
  var $tocParent = $toc.find('>li').has('>ul');

  $tocParent.addClass('am-parent');

  $tocParent.on('mouseenter', function() {
    var $subToc = $(this).children('ul');
    $subToc.collapse('open');
    $(this).addClass('am-open');
    // $(this).siblings('li').children('ul.am-in').collapse('close');
  });

  $toc.find('a').on('click', function(e) {
    e.preventDefault();
    var anchor = decodeURIComponent($(this).attr('href'));
    var $anchor = $(anchor);

    $anchor.length && $(w).smoothScroll({position: $anchor.offset().top});
  });

  // TODO: 使用 pushState
};

amaze.init = function() {
  this.auth();
  this.externalLink();
  this.checkLogin();
  this.zeroClip();
  this.toolbar();
  this.standaloneMode();
  this.getIssues();
  this.docToc();
  this.sticky();
  // this.pageChange();
};

$(function() {
  amaze.init();
  $('.amz-social [data-am-modal]').on('click', function(e) {
    e.preventDefault();
  });

  var iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  if (iOS) {
    $html.addClass('ios');
  }
});

},{"blueimp-md5":2,"notifyjs":3,"store":4}],2:[function(require,module,exports){
/*
 * JavaScript MD5 1.0.1
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 * 
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*jslint bitwise: true */
/*global unescape, define */

(function ($) {
    'use strict';

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
    * Bitwise rotate a 32-bit number to the left.
    */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
    * These functions implement the four basic operations the algorithm uses.
    */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var i, olda, oldb, oldc, oldd,
            a =  1732584193,
            b = -271733879,
            c = -1732584194,
            d =  271733878;

        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = md5_ff(a, b, c, d, x[i],       7, -680876936);
            d = md5_ff(d, a, b, c, x[i +  1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i +  2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i +  3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i +  4],  7, -176418897);
            d = md5_ff(d, a, b, c, x[i +  5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i +  6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i +  7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i +  8],  7,  1770035416);
            d = md5_ff(d, a, b, c, x[i +  9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12],  7,  1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i +  1],  5, -165796510);
            d = md5_gg(d, a, b, c, x[i +  6],  9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i],      20, -373897302);
            a = md5_gg(a, b, c, d, x[i +  5],  5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10],  9,  38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i +  4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i +  9],  5,  568446438);
            d = md5_gg(d, a, b, c, x[i + 14],  9, -1019803690);
            c = md5_gg(c, d, a, b, x[i +  3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i +  8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i + 13],  5, -1444681467);
            d = md5_gg(d, a, b, c, x[i +  2],  9, -51403784);
            c = md5_gg(c, d, a, b, x[i +  7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i +  5],  4, -378558);
            d = md5_hh(d, a, b, c, x[i +  8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i +  1],  4, -1530992060);
            d = md5_hh(d, a, b, c, x[i +  4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i +  7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13],  4,  681279174);
            d = md5_hh(d, a, b, c, x[i],      11, -358537222);
            c = md5_hh(c, d, a, b, x[i +  3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i +  6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i +  9],  4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i +  2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i],       6, -198630844);
            d = md5_ii(d, a, b, c, x[i +  7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i +  5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12],  6,  1700485571);
            d = md5_ii(d, a, b, c, x[i +  3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i +  1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i +  8],  6,  1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i +  6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i +  4],  6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i +  2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i +  9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    /*
    * Convert an array of little-endian words to a string
    */
    function binl2rstr(input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    }

    /*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */
    function rstr2binl(input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    }

    /*
    * Calculate the MD5 of a raw string
    */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }

    /*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */
    function rstr_hmac_md5(key, data) {
        var i,
            bkey = rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;
        if (bkey.length > 16) {
            bkey = binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }

    /*
    * Convert a raw string to a hex string
    */
    function rstr2hex(input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) +
                hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    /*
    * Encode a string as utf-8
    */
    function str2rstr_utf8(input) {
        return unescape(encodeURIComponent(input));
    }

    /*
    * Take string arguments and return either raw or hex encoded strings
    */
    function raw_md5(s) {
        return rstr_md5(str2rstr_utf8(s));
    }
    function hex_md5(s) {
        return rstr2hex(raw_md5(s));
    }
    function raw_hmac_md5(k, d) {
        return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
    }
    function hex_hmac_md5(k, d) {
        return rstr2hex(raw_hmac_md5(k, d));
    }

    function md5(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hex_md5(string);
            }
            return raw_md5(string);
        }
        if (!raw) {
            return hex_hmac_md5(key, string);
        }
        return raw_hmac_md5(key, string);
    }

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return md5;
        });
    } else {
        $.md5 = md5;
    }
}(this));

},{}],3:[function(require,module,exports){
(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD environment
        define('notify', [], function () {
            return factory(root, document);
        });
    } else if (typeof exports === 'object') {
        // CommonJS environment
        module.exports = factory(root, document);
    } else {
        // Browser environment
        root.Notify = factory(root, document);
    }

}(window, function (w, d) {

    'use strict';

    function isFunction (item) {
        return typeof item === 'function';
    }

    function Notify(title, options) {

        if (typeof title !== 'string') {
            throw new Error('Notify(): first arg (title) must be a string.');
        }

        this.title = title;

        this.options = {
            icon: '',
            body: '',
            tag: '',
            notifyShow: null,
            notifyClose: null,
            notifyClick: null,
            notifyError: null,
            permissionGranted: null,
            permissionDenied: null,
            timeout: null
        };

        this.permission = null;

        if (!Notify.isSupported) {
            return;
        }

        //User defined options for notification content
        if (typeof options === 'object') {

            for (var i in options) {
                if (options.hasOwnProperty(i)) {
                    this.options[i] = options[i];
                }
            }

            //callback when notification is displayed
            if (isFunction(this.options.notifyShow)) {
                this.onShowCallback = this.options.notifyShow;
            }

            //callback when notification is closed
            if (isFunction(this.options.notifyClose)) {
                this.onCloseCallback = this.options.notifyClose;
            }

            //callback when notification is clicked
            if (isFunction(this.options.notifyClick)) {
                this.onClickCallback = this.options.notifyClick;
            }

            //callback when notification throws error
            if (isFunction(this.options.notifyError)) {
                this.onErrorCallback = this.options.notifyError;
            }
        }
    }

    // true if the browser supports HTML5 Notification
    Notify.isSupported = 'Notification' in w;

    // true if the permission is not granted
    Notify.needsPermission = !(Notify.isSupported && Notification.permission === 'granted');

    // asks the user for permission to display notifications.  Then calls the callback functions is supplied.
    Notify.requestPermission = function (onPermissionGrantedCallback, onPermissionDeniedCallback) {
        if (!Notify.isSupported) {
            return;
        }
        w.Notification.requestPermission(function (perm) {
            switch (perm) {
                case 'granted':
                    if (isFunction(onPermissionGrantedCallback)) {
                        onPermissionGrantedCallback();
                    }
                    break;
                case 'denied':
                    if (isFunction(onPermissionDeniedCallback)) {
                        onPermissionDeniedCallback();
                    }
                    break;
            }
        });
    };


    Notify.prototype.show = function () {

        if (!Notify.isSupported) {
            return;
        }

        this.myNotify = new Notification(this.title, {
            'body': this.options.body,
            'tag' : this.options.tag,
            'icon' : this.options.icon
        });

        if (this.options.timeout && !isNaN(this.options.timeout)) {
            setTimeout(this.close.bind(this), this.options.timeout * 1000);
        }

        this.myNotify.addEventListener('show', this, false);
        this.myNotify.addEventListener('error', this, false);
        this.myNotify.addEventListener('close', this, false);
        this.myNotify.addEventListener('click', this, false);
    };

    Notify.prototype.onShowNotification = function (e) {
        if (this.onShowCallback) {
            this.onShowCallback(e);
        }
    };

    Notify.prototype.onCloseNotification = function (e) {
        if (this.onCloseCallback) {
            this.onCloseCallback(e);
        }
        this.destroy();
    };

    Notify.prototype.onClickNotification = function (e) {
        if (this.onClickCallback) {
            this.onClickCallback(e);
        }
    };

    Notify.prototype.onErrorNotification = function (e) {
        if (this.onErrorCallback) {
            this.onErrorCallback(e);
        }
        this.destroy();
    };

    Notify.prototype.destroy = function () {
        this.myNotify.removeEventListener('show', this, false);
        this.myNotify.removeEventListener('error', this, false);
        this.myNotify.removeEventListener('close', this, false);
        this.myNotify.removeEventListener('click', this, false);
    };

    Notify.prototype.close = function () {
        this.myNotify.close();
    };

    Notify.prototype.handleEvent = function (e) {
        switch (e.type) {
        case 'show':
            this.onShowNotification(e);
            break;
        case 'close':
            this.onCloseNotification(e);
            break;
        case 'click':
            this.onClickNotification(e);
            break;
        case 'error':
            this.onErrorNotification(e);
            break;
        }
    };

    return Notify;

}));

},{}],4:[function(require,module,exports){
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.set = function(key, value) {}
	store.get = function(key) {}
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		var val = store.get(key)
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (typeof val == 'undefined') { val = defaultVal || {} }
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key) { return store.deserialize(storage.getItem(key)) }
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			return store.deserialize(storage.getAttribute(key))
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled

	if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }

})(Function('return this')());

},{}]},{},[1])