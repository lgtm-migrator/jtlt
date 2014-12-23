/*global JTLT*/

(function () {'use strict';

JTLT({
    templates: [{
        name: 'author', // For use with calling templates
        path: '$.store.book[*].author',
        template: function () {
            this.set('<b>' + value + '</b>');
        }
    }],
    ajaxData: 'data/jsonpath-sample.json',
    success: function (result) {
        alert('result:'+result);
    }
}).transform();

}());
