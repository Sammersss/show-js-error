/*! show-js-error | © 2016 Denis Seleznev | MIT License */
/* exported showJSError */
var showJSError = {
    init: function(settings) {
        var that = this;

        this.settings = settings || {};

        this._buffer = [];
        this._isLast = true;
        this._i = 0;

        this._onerror = function(e) {
            that._buffer.push(e);
            if (that._isLast) {
                that._i = that._buffer.length - 1;
            }

            that._update();
        };

        if (window.addEventListener) {
            window.addEventListener('error', this._onerror, false);
        } else {
            var oldOnError = window.onerror;
            window.onerror = function(message, filename, lineno, colno, error) {
                this._onerror({
                    message: message,
                    filename: filename,
                    lineno: lineno,
                    colno: colno,
                    error: error
                });

                if (typeof oldOnError === 'function') {
                    oldOnError.apply(window, arguments);
                }
            };
        }
    },
    show: function(err) {
        if (typeof err !== 'undefined') {
            this._buffer.push(typeof err === 'object' ? err : new Error(err));
            this._update();
        }

        this._show();
    },
    hide: function() {
        this._container.className = this.elemClass('');
    },
    copyText: function() {
        var err = this._buffer[this._i],
            text = this._getDetailedMessage(err),
            body = document.body;

        var textarea = this.elem({
            name: 'textarea',
            tag: 'textarea',
            props: {
                innerHTML: text
            },
            container: body
        });

        try {
            textarea.select();
            document.execCommand('copy');
        } catch(e) {
            alert('Copying text is not supported in this browser.');
        }

        body.removeChild(textarea);
    },
    elem: function(data) {
        var el = document.createElement(data.tag || 'div'),
            props = data.props;

        for (var i in props) {
            if (props.hasOwnProperty(i)) {
                el[i] = props[i];
            }
        }

        el.className = this.elemClass(data.name);

        data.container.appendChild(el);

        return el;
    },
    elemClass: function(name, mod) {
        var cl = 'show-js-error';
        if (name) {
            cl += '__' + name;
        }

        if (mod) {
            cl += ' ' + cl + '_' + mod;
        }

        return cl;
    },
    escapeHTML: function(text) {
        return (text || '').replace(/[&<>"'\/]/g, function(sym) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;',
                '/': '&#x2F;'
            }[sym];
        });
    },
    toggleDetailed: function() {
        if (this._toggleDetailed) {
            this._toggleDetailed = false;
            this._body.className = this.elemClass('body');
        } else {
            this._toggleDetailed = true;
            this._body.className = this.elemClass('body', 'detailed');
        }
    },
    _append: function() {
        var that = this,
            append = function() {
                document.body.appendChild(that._container);
            };

        this._container = document.createElement('div');
        this._container.className = this.elemClass('');

        this._title = this.elem({
            name: 'title',
            props: {
                innerHTML: this.settings.title || ''
            },
            container: this._container
        });

        this._body = this.elem({
            name: 'body',
            container: this._container
        });

        this._message = this.elem({
            name: 'message',
            props: {
                onclick: function() {
                    that.toggleDetailed();
                }
            },
            container: this._body
        });

        this._filename = this.elem({
            name: 'filename',
            container: this._body
        });

        if (this.settings.userAgent) {
            this._ua = this.elem({
                name: 'ua',
                container: this._body
            });
        }

        this.elem({
            name: 'close',
            props: {
                innerHTML: '×',
                onclick: function() {
                    that.hide();
                }
            },
            container: this._container
        });

        this._actions = this.elem({
            name: 'actions',
            container: this._container
        });

        this.elem({
            tag: 'input',
            name: 'copy',
            props: {
                type: 'button',
                value: 'Copy',
                onclick: function() {
                    that.copyText();
                }
            },
            container: this._actions
        });

        if (this.settings.send) {
            this._sendLink = this.elem({
                tag: 'a',
                name: 'send-link',
                props: {
                    href: '',
                    target: '_blank'
                },
                container: this._actions
            });

            this._send = this.elem({
                tag: 'input',
                name: 'send',
                props: {
                    type: 'button',
                    value: 'Send'
                },
                container: this._sendLink
            });
        }

        this._arrows = this.elem({
            tag: 'span',
            name: 'arrows',
            container: this._actions
        });

        this._prev = this.elem({
            tag: 'input',
            name: 'prev',
            props: {
                type: 'button',
                value: '←',
                onclick: function() {
                    that._isLast = false;
                    if (that._i) {
                        that._i--;
                    }

                    that._update();
                }
            },
            container: this._arrows
        });

        this._num = this.elem({
            tag: 'span',
            name: 'num',
            props: {
                innerHTML: this._i + 1
            },
            container: this._arrows
        });

        this._next = this.elem({
            tag: 'input',
            name: 'next',
            props: {
                type: 'button',
                value: '→',
                onclick: function() {
                    that._isLast = false;
                    if (that._i < that._buffer.length - 1) {
                        that._i++;
                    }

                    that._update();
                }
            },
            container: this._arrows
        });

        if (document.body) {
            append();
        } else {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', function() {
                    append();
                }, false);
            } else if (document.attachEvent) {
                document.attachEvent('onload', function() {
                    append();
                });
            }
        }
    },
    _getDetailedMessage: function(err) {
        return [
            'Message: ' + this._getMessage(err),
            'Filename: ' + this._getFilenameWithPosition(err),
            'Stack: ' + this._getStack(err),
            'Page url: ' + window.location.href,
            'Refferer: ' + document.referrer,
            'User-agent: ' + (this.settings.userAgent || navigator.userAgent)
        ].join('\n')
    },
    _getExtFilename: function(e) {
        var html = this.escapeHTML(this._getFilenameWithPosition(e));
        if (e.filename && e.filename.search(/^https?:|file:/) !== -1) {
            return '<a target="_blank" href="view-source:' +
                this.escapeHTML(e.filename) + '">' + html + '</a>';
        } else {
            return html;
        }
    },
    _getFilenameWithPosition: function(e) {
        return e.filename ?
            e.filename +
            ':' + (typeof e.lineno !== 'undefined' ? e.lineno : '') +
            ':' + (typeof e.colno !== 'undefined' ? e.colno : '')
            : '';
    },
    _getMessage: function(e) {
        var msg = e.message;

        // IE
        if (e.error && e.error.name && 'number' in e.error) {
            msg = e.error.name + ': ' + msg;
        }

        return msg;
    },
    _getStack: function(err) {
        return (err.error && err.error.stack) || err.stack || '';
    },
    _show: function() {
        this._container.className = this.elemClass('', 'visible');
    },
    _update: function() {
        if (!this._appended) {
            this._append();
            this._appended = true;
        }

        var e = this._buffer[this._i],
            filename;

        if (e.stack) {
            filename = this.escapeHTML(e.stack);
        } else {
            filename = this._getExtFilename(e);
        }

        this._title.innerHTML = this.escapeHTML(e.title || this.settings.title || '');

        this._message.innerHTML = this.escapeHTML(this._getMessage(e));

        this._filename.innerHTML = filename;

        if (this.settings.userAgent) {
            this._ua.innerHTML = this.escapeHTML(navigator.userAgent);
        }

        if (this.settings.send) {
            this._sendLink.href = this.settings.send
                .replace(/\{title\}/, encodeURIComponent(this._getMessage(e)))
                .replace(/\{body\}/, encodeURIComponent(this._getDetailedMessage(e)));
        }

        if (this._buffer.length > 1) {
            this._arrows.className = this.elemClass('arrows', 'visible');
        }

        this._prev.disabled = !this._i;
        this._num.innerHTML = this._i + 1;
        this._next.disabled = this._i === this._buffer.length - 1;

        this._show();
    }
};
