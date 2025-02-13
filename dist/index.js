'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ts = require('typescript');
var ts__default = _interopDefault(ts);
var eslintUtils = require('eslint-utils');
var tsutils = require('tsutils');

const SyntaxKind = ts__default.SyntaxKind;
function isPrivate(originalNode) {
    if (originalNode.modifiers) {
        return originalNode.modifiers.some(m => (m.kind === ts__default.SyntaxKind.PrivateKeyword ||
            m.kind === ts__default.SyntaxKind.ProtectedKeyword));
    }
    return false;
}
function getDecorator(node, decoratorName) {
    if (decoratorName) {
        return node.decorators && node.decorators.find(isDecoratorNamed(decoratorName));
    }
    return node.decorators ? node.decorators.filter((dec) => dec.expression) : [];
}
function parseDecorator(decorator) {
    if (decorator && decorator.expression && decorator.expression.type === 'CallExpression') {
        return decorator.expression.arguments.map((a) => {
            const parsed = eslintUtils.getStaticValue(a);
            return parsed ? parsed.value : undefined;
        });
    }
    return [];
}
function decoratorName(dec) {
    return dec.expression && dec.expression.callee && dec.expression.callee.name;
}
function isDecoratorNamed(propName) {
    return (dec) => {
        return decoratorName(dec) === propName;
    };
}
function stencilComponentContext() {
    let componentNode;
    return {
        rules: {
            'ClassDeclaration': (node) => {
                const component = getDecorator(node, 'Component');
                if (component) {
                    componentNode = component;
                }
            },
            'ClassDeclaration:exit': (node) => {
                if (componentNode === node) {
                    componentNode = undefined;
                }
            }
        },
        isComponent() {
            return !!componentNode;
        }
    };
}
function getType(node) {
    return node.typeAnnotation.typeAnnotation.typeName.name;
}
const stencilDecorators = ['Component', 'Prop', 'State', 'Watch', 'Element', 'Method', 'Event', 'Listen'];
const stencilLifecycle = [
    'connectedCallback',
    'disconnectedCallback',
    'componentWillLoad',
    'componentDidLoad',
    'componentWillRender',
    'componentDidRender',
    'componentWillUpdate',
    'componentDidUpdate',
    'render'
];
const TOKEN_TO_TEXT = {
    [SyntaxKind.OpenBraceToken]: '{',
    [SyntaxKind.CloseBraceToken]: '}',
    [SyntaxKind.OpenParenToken]: '(',
    [SyntaxKind.CloseParenToken]: ')',
    [SyntaxKind.OpenBracketToken]: '[',
    [SyntaxKind.CloseBracketToken]: ']',
    [SyntaxKind.DotToken]: '.',
    [SyntaxKind.DotDotDotToken]: '...',
    [SyntaxKind.SemicolonToken]: ',',
    [SyntaxKind.CommaToken]: ',',
    [SyntaxKind.LessThanToken]: '<',
    [SyntaxKind.GreaterThanToken]: '>',
    [SyntaxKind.LessThanEqualsToken]: '<=',
    [SyntaxKind.GreaterThanEqualsToken]: '>=',
    [SyntaxKind.EqualsEqualsToken]: '==',
    [SyntaxKind.ExclamationEqualsToken]: '!=',
    [SyntaxKind.EqualsEqualsEqualsToken]: '===',
    [SyntaxKind.InstanceOfKeyword]: 'instanceof',
    [SyntaxKind.ExclamationEqualsEqualsToken]: '!==',
    [SyntaxKind.EqualsGreaterThanToken]: '=>',
    [SyntaxKind.PlusToken]: '+',
    [SyntaxKind.MinusToken]: '-',
    [SyntaxKind.AsteriskToken]: '*',
    [SyntaxKind.AsteriskAsteriskToken]: '**',
    [SyntaxKind.SlashToken]: '/',
    [SyntaxKind.PercentToken]: '%',
    [SyntaxKind.PlusPlusToken]: '++',
    [SyntaxKind.MinusMinusToken]: '--',
    [SyntaxKind.LessThanLessThanToken]: '<<',
    [SyntaxKind.LessThanSlashToken]: '</',
    [SyntaxKind.GreaterThanGreaterThanToken]: '>>',
    [SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: '>>>',
    [SyntaxKind.AmpersandToken]: '&',
    [SyntaxKind.BarToken]: '|',
    [SyntaxKind.CaretToken]: '^',
    [SyntaxKind.ExclamationToken]: '!',
    [SyntaxKind.TildeToken]: '~',
    [SyntaxKind.AmpersandAmpersandToken]: '&&',
    [SyntaxKind.BarBarToken]: '||',
    [SyntaxKind.QuestionToken]: '?',
    [SyntaxKind.ColonToken]: ':',
    [SyntaxKind.EqualsToken]: '=',
    [SyntaxKind.PlusEqualsToken]: '+=',
    [SyntaxKind.MinusEqualsToken]: '-=',
    [SyntaxKind.AsteriskEqualsToken]: '*=',
    [SyntaxKind.AsteriskAsteriskEqualsToken]: '**=',
    [SyntaxKind.SlashEqualsToken]: '/=',
    [SyntaxKind.PercentEqualsToken]: '%=',
    [SyntaxKind.LessThanLessThanEqualsToken]: '<<=',
    [SyntaxKind.GreaterThanGreaterThanEqualsToken]: '>>=',
    [SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: '>>>=',
    [SyntaxKind.AmpersandEqualsToken]: '&=',
    [SyntaxKind.BarEqualsToken]: '|=',
    [SyntaxKind.CaretEqualsToken]: '^=',
    [SyntaxKind.AtToken]: '@',
    [SyntaxKind.InKeyword]: 'in',
    [SyntaxKind.UniqueKeyword]: 'unique',
    [SyntaxKind.KeyOfKeyword]: 'keyof',
    [SyntaxKind.NewKeyword]: 'new',
    [SyntaxKind.ImportKeyword]: 'import',
    [SyntaxKind.ReadonlyKeyword]: 'readonly'
};

const rule = {
    meta: {
        docs: {
            description: 'This rule catches Stencil public methods that are not async.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem',
        fixable: 'code'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        const typeChecker = parserServices.program.getTypeChecker();
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition > Decorator[expression.callee.name=Method]': (decoratorNode) => {
                if (!stencil.isComponent()) {
                    return;
                }
                const node = decoratorNode.parent;
                const method = parserServices.esTreeNodeToTSNodeMap.get(node);
                const signature = typeChecker.getSignatureFromDeclaration(method);
                const returnType = typeChecker.getReturnTypeOfSignature(signature);
                if (!tsutils.isThenableType(typeChecker, method, returnType)) {
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    const text = String(originalNode.getFullText());
                    context.report({
                        node: node.key,
                        message: `External @Method() ${node.key.name}() must return a Promise. Consider prefixing the method with async, such as @Method() async ${node.key.name}().`,
                        fix(fixer) {
                            const result = text.replace('@Method()\n', '@Method()\nasync')
                                .replace('@Method() ', '@Method() async')
                                .replace('async public', 'public async')
                                .replace('async private', 'private async');
                            return fixer.replaceText(node, result);
                        }
                    });
                }
            } });
    }
};

const DEFAULTS = ['stencil', 'stnl', 'st'];
const rule$1 = {
    meta: {
        docs: {
            description: 'This rule catches usages banned prefix in component tag name.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [
            {
                type: 'array',
                items: {
                    type: 'string'
                },
                minLength: 1,
                additionalProperties: false
            }
        ],
        type: 'problem'
    },
    create(context) {
        const stencil = stencilComponentContext();
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassDeclaration': (node) => {
                const component = getDecorator(node, 'Component');
                if (!component) {
                    return;
                }
                const [opts] = parseDecorator(component);
                if (!opts || !opts.tag) {
                    return;
                }
                const tag = opts.tag;
                const options = context.options[0] || DEFAULTS;
                const match = options.some((t) => tag.startsWith(t));
                if (match) {
                    context.report({
                        node: node,
                        message: `The component with tag name ${tag} have a banned prefix.`
                    });
                }
            } });
    }
};

const rule$2 = {
    meta: {
        docs: {
            description: 'This rule catches usages of non valid class names.',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [
            {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string'
                    },
                    ignoreCase: {
                        type: 'boolean'
                    }
                },
                additionalProperties: false
            }
        ],
        type: 'problem'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassDeclaration': (node) => {
                const component = getDecorator(node, 'Component');
                const options = context.options[0];
                const { pattern, ignoreCase } = options || {};
                if (!component || !options || !pattern) {
                    return;
                }
                const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const className = originalNode.symbol.escapedName;
                const regExp = new RegExp(pattern, ignoreCase ? 'i' : undefined);
                if (!regExp.test(className)) {
                    const [opts] = parseDecorator(component);
                    if (!opts || !opts.tag) {
                        return;
                    }
                    context.report({
                        node: node,
                        message: `The class name in component with tag name ${opts.tag} is not valid (${regExp}).`
                    });
                }
            } });
    }
};

const rule$3 = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Decorators used in incorrect locations.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        const stencil = stencilComponentContext();
        return Object.assign(Object.assign({}, stencil.rules), { 'Decorator': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                if (node.expression && node.expression.callee) {
                    const decName = node.expression.callee.name;
                    if (decName === 'Prop' ||
                        decName === 'State' ||
                        decName === 'Element' ||
                        decName === 'Event') {
                        if (node.parent.type !== 'ClassProperty') {
                            context.report({
                                node: node,
                                message: `The @${decName} decorator can only be applied to class properties.`
                            });
                        }
                    }
                    else if (decName === 'Method' ||
                        decName === 'Watch' ||
                        decName === 'Listen') {
                        if (node.parent.type !== 'MethodDefinition') {
                            context.report({
                                node: node,
                                message: `The @${decName} decorator can only be applied to class methods.`
                            });
                        }
                    }
                    else if (decName === 'Component') {
                        if (node.parent.type !== 'ClassDeclaration') {
                            context.report({
                                node: node,
                                message: `The @${decName} decorator can only be applied to a class.`
                            });
                        }
                    }
                }
            } });
    }
};

const ENUMERATE = ['inline', 'multiline', 'ignore'];
const DEFAULTS$1 = {
    prop: 'ignore',
    state: 'ignore',
    element: 'ignore',
    event: 'ignore',
    method: 'ignore',
    watch: 'ignore',
    listen: 'ignore'
};
const rule$4 = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Decorators not used in consistent style.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [
            {
                type: 'object',
                properties: {
                    prop: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    state: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    element: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    event: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    method: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    watch: {
                        type: 'string',
                        enum: ENUMERATE
                    },
                    listen: {
                        type: 'string',
                        enum: ENUMERATE
                    }
                }
            }
        ],
        type: 'layout'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        const opts = context.options[0] || {};
        const options = Object.assign(Object.assign({}, DEFAULTS$1), opts);
        function checkStyle(decorator) {
            const decName = decoratorName(decorator);
            const config = options[decName.toLowerCase()];
            if (!config || config === 'ignore') {
                return;
            }
            const decoratorNode = parserServices.esTreeNodeToTSNodeMap.get(decorator);
            const decoratorText = decoratorNode.getText()
                .replace('(', '\\(')
                .replace(')', '\\)');
            const text = decoratorNode.parent.getText();
            const separator = config === 'multiline' ? '\\r?\\n' : ' ';
            const regExp = new RegExp(`${decoratorText}${separator}`, 'i');
            if (!regExp.test(text)) {
                const node = decorator.parent;
                context.report({
                    node: node,
                    message: `The @${decName} decorator can only be applied as ${config}.`,
                });
            }
        }
        function getStyle(node) {
            if (!stencil.isComponent() || !options || !Object.keys(options).length) {
                return;
            }
            const decorators = getDecorator(node);
            decorators.filter((dec) => stencilDecorators.includes(decoratorName(dec))).forEach(checkStyle);
        }
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty': getStyle, 'MethodDefinition[kind=method]': getStyle });
    }
};

const rule$5 = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Element type not matching tag name.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem',
        fixable: 'code'
    },
    create(context) {
        const stencil = stencilComponentContext();
        function parseTag(tag) {
            let result = tag[0].toUpperCase() + tag.slice(1);
            const tagBody = tag.split('-');
            if (tagBody.length > 1) {
                result = tagBody.map((tpart) => tpart[0].toUpperCase() + tpart.slice(1)).join('');
            }
            return result;
        }
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty > Decorator[expression.callee.name=Element]': (node) => {
                if (stencil.isComponent()) {
                    const tagType = getType(node.parent);
                    const component = getDecorator(node.parent.parent.parent, 'Component');
                    const [opts] = parseDecorator(component);
                    if (!opts || !opts.tag) {
                        return;
                    }
                    const parsedTag = `HTML${parseTag(opts.tag)}Element`;
                    if (tagType !== parsedTag) {
                        context.report({
                            node: node.parent.typeAnnotation,
                            message: `@Element type is not matching tag for component (${parsedTag})`,
                            fix(fixer) {
                                return fixer.replaceText(node.parent.typeAnnotation.typeAnnotation, parsedTag);
                            }
                        });
                    }
                }
            } });
    }
};

/**
 * @fileoverview ESLint rules specific to Stencil JS projects.
 * @author Tom Chinery <tom.chinery@addtoevent.co.uk>
 */
const rule$6 = {
    meta: {
        docs: {
            description: 'This rule catches usage of hostData method.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------
        const stencil = stencilComponentContext();
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition[key.name=hostData]': (node) => {
                if (stencil.isComponent()) {
                    context.report({
                        node: node.key,
                        message: `hostData() is deprecated and <Host> should be used in the render function instead.`
                    });
                }
            } });
    }
};

const rule$7 = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Methods marked as private or protected.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition[kind=method]': (node) => {
                if (stencil.isComponent() && getDecorator(node, 'Method')) {
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    if (isPrivate(originalNode)) {
                        context.report({
                            node: node,
                            message: `Class methods decorated with @Method() cannot be private nor protected`
                        });
                    }
                }
            } });
    }
};

const varsList = new Set();
const rule$8 = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Watch for not defined variables in Prop or State.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'suggestion'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        function getVars(node) {
            if (!stencil.isComponent()) {
                return;
            }
            const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const varName = originalNode.parent.name.escapedText;
            varsList.add(varName);
        }
        function checkWatch(node) {
            if (!stencil.isComponent()) {
                return;
            }
            const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const varName = originalNode.expression.arguments[0].text;
            if (!varsList.has(varName)) {
                context.report({
                    node: node,
                    message: `Watch decorator @Watch("${varName}") is not matching with any @Prop() or @State()`,
                });
            }
        }
        return {
            'ClassDeclaration': stencil.rules.ClassDeclaration,
            'ClassProperty > Decorator[expression.callee.name=Prop]': getVars,
            'ClassProperty > Decorator[expression.callee.name=State]': getVars,
            'MethodDefinition[kind=method] > Decorator[expression.callee.name=Watch]': checkWatch,
            'ClassDeclaration:exit': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                stencil.rules['ClassDeclaration:exit'](node);
                varsList.clear();
            }
        };
    }
};

const rule$9 = {
    meta: {
        docs: {
            description: 'This rule catches own class methods marked as public.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem',
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition[kind=method]': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const stencilDecorator = originalNode.decorators && originalNode.decorators?.some((dec) => stencilDecorators.includes(dec.expression.expression?.escapedText));
                const stencilCycle = stencilLifecycle.includes(originalNode.name.escapedText);
                if (!stencilDecorator && !stencilCycle && !isPrivate(originalNode)) {
                    context.report({
                        node: node,
                        message: `Own class methods cannot be public`
                    });
                }
            } });
    }
};

const rule$a = {
    meta: {
        docs: {
            description: 'This rule catches own class attributes marked as public.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem',
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const stencilDecorator = originalNode.decorators && originalNode.decorators?.some((dec) => stencilDecorators.includes(dec.expression.expression?.escapedText));
                if (!stencilDecorator && !isPrivate(originalNode)) {
                    context.report({
                        node: node,
                        message: `Own class properties cannot be public`,
                    });
                }
            } });
    }
};

const rule$b = {
    meta: {
        docs: {
            description: 'This rule catches usages of events using @Listen decorator.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        const stencil = stencilComponentContext();
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition[kind=method]': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                const listenDec = getDecorator(node, 'Listen');
                if (listenDec) {
                    const [eventName, opts] = parseDecorator(listenDec);
                    if (typeof eventName === 'string' && opts === undefined) {
                        const eventName = listenDec.expression.arguments[0].value;
                        if (PREFER_VDOM_LISTENER.includes(eventName)) {
                            context.report({
                                node: listenDec,
                                message: `Use vDOM listener instead.`
                            });
                        }
                    }
                }
            } });
    }
};
const PREFER_VDOM_LISTENER = [
    'click',
    'touchstart',
    'touchend',
    'touchmove',
    'mousedown',
    'mouseup',
    'mousemove',
    'keyup',
    'keydown',
    'focusin',
    'focusout',
    'focus',
    'blur'
];

const rule$c = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Props marked as private or protected.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem',
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty': (node) => {
                if (stencil.isComponent() && getDecorator(node, 'Prop')) {
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    if (isPrivate(originalNode)) {
                        context.report({
                            node: node,
                            message: `Class properties decorated with @Prop() cannot be private nor protected`
                        });
                    }
                }
            } });
    }
};

const rule$d = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Props marked as non readonly.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'layout',
        fixable: 'code'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty': (node) => {
                const propDecorator = getDecorator(node, 'Prop');
                if (stencil.isComponent() && propDecorator) {
                    const [opts] = parseDecorator(propDecorator);
                    if (opts && opts.mutable === true) {
                        return;
                    }
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    const hasReadonly = !!(originalNode.modifiers &&
                        originalNode.modifiers.some(m => m.kind === ts__default.SyntaxKind.ReadonlyKeyword));
                    if (!hasReadonly) {
                        context.report({
                            node: node.key,
                            message: `Class properties decorated with @Prop() should be readonly`,
                            fix(fixer) {
                                return fixer.insertTextBefore(node.key, 'readonly ');
                            }
                        });
                    }
                }
            } });
    }
};

/**
 * @fileoverview ESLint rules specific to Stencil JS projects.
 * @author Tom Chinery <tom.chinery@addtoevent.co.uk>
 */
const rule$e = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Prop names that share names of Global HTML Attributes.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        const typeChecker = parserServices.program.getTypeChecker();
        return Object.assign(Object.assign({}, stencil.rules), { 'MethodDefinition[kind=method][key.name=render] ReturnStatement': (node) => {
                if (!stencil.isComponent()) {
                    return;
                }
                const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node.argument);
                const type = typeChecker.getTypeAtLocation(originalNode);
                if (type && type.symbol && type.symbol.escapedName === 'Array') {
                    context.report({
                        node: node,
                        message: `Avoid returning an array in the render() function, use <Host> instead.`
                    });
                }
            } });
    }
};

const DECORATORS = ['Prop', 'Method', 'Event'];
const INVALID_TAGS = ['type', 'memberof'];
const rule$f = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Props and Methods using jsdoc.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'layout'
    },
    create(context) {
        const stencil = stencilComponentContext();
        const parserServices = context.parserServices;
        function getJSDoc(node) {
            if (!stencil.isComponent()) {
                return;
            }
            DECORATORS.forEach((decName) => {
                if (getDecorator(node, decName)) {
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    const jsDoc = originalNode.jsDoc;
                    const isValid = jsDoc && jsDoc.length;
                    const haveTags = isValid &&
                        jsDoc.some((jsdoc) => jsdoc.tags && jsdoc.tags.length && jsdoc.tags.some((tag) => INVALID_TAGS.includes(tag.tagName.escapedText.toLowerCase())));
                    if (!isValid) {
                        context.report({
                            node: node,
                            message: `The @${decName} decorator must to be documented.`
                        });
                    }
                    else if (haveTags) {
                        context.report({
                            node: node,
                            message: `The @${decName} decorator have not valid tags (${INVALID_TAGS.join(', ')}).`
                        });
                    }
                }
            });
        }
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty': getJSDoc, 'MethodDefinition[kind=method]': getJSDoc });
    }
};

const rule$g = {
    meta: {
        docs: {
            description: 'This rule catches required prefix in component tag name.',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [
            {
                type: 'array',
                minLength: 1,
                additionalProperties: false
            }
        ],
        type: 'layout'
    },
    create(context) {
        const stencil = stencilComponentContext();
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassDeclaration': (node) => {
                const component = getDecorator(node, 'Component');
                if (!component) {
                    return;
                }
                const [{ tag }] = parseDecorator(component);
                const options = context.options[0];
                const match = options.some((t) => tag.startsWith(t));
                if (!match) {
                    context.report({
                        node: node,
                        message: `The component with tagName ${tag} have not a valid prefix.`
                    });
                }
            } });
    }
};

/**
 * @fileoverview ESLint rules specific to Stencil JS projects.
 * @author Tom Chinery <tom.chinery@addtoevent.co.uk>
 */
const rule$h = {
    meta: {
        docs: {
            description: 'This rule catches Stencil Prop names that share names of Global HTML Attributes.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------
        const stencil = stencilComponentContext();
        const checkName = (node) => {
            if (!stencil.isComponent()) {
                return;
            }
            const decoratorName = node.expression.callee.name;
            if (decoratorName === 'Prop' || decoratorName === 'Method') {
                const propName = node.parent.key.name;
                if (isReservedMember(propName)) {
                    context.report({
                        node: node.parent.key,
                        message: `The @${decoratorName} name "${propName} conflicts with a key in the HTMLElement prototype. Please choose a different name.`
                    });
                }
                if (propName.startsWith('data-')) {
                    context.report({
                        node: node.parent.key,
                        message: 'Avoid using Global HTML Attributes as Prop names.'
                    });
                }
            }
        };
        return Object.assign(Object.assign({}, stencil.rules), { 'ClassProperty > Decorator[expression.callee.name=Prop]': checkName, 'MethodDefinition[kind=method] > Decorator[expression.callee.name=Method]': checkName });
    }
};
const HTML_ELEMENT_KEYS = [
    'title',
    'lang',
    'translate',
    'dir',
    // 'dataset',
    // 'hidden',
    'tabIndex',
    'accessKey',
    'draggable',
    // 'spellcheck',
    // 'autocapitalize',
    'contentEditable',
    'isContentEditable',
    // 'inputMode',
    'offsetParent',
    'offsetTop',
    'offsetLeft',
    'offsetWidth',
    'offsetHeight',
    'style',
    'innerText',
    'outerText',
    'oncopy',
    'oncut',
    'onpaste',
    'onabort',
    'onblur',
    'oncancel',
    'oncanplay',
    'oncanplaythrough',
    'onchange',
    'onclick',
    'onclose',
    'oncontextmenu',
    'oncuechange',
    'ondblclick',
    'ondrag',
    'ondragend',
    'ondragenter',
    'ondragleave',
    'ondragover',
    'ondragstart',
    'ondrop',
    'ondurationchange',
    'onemptied',
    'onended',
    'onerror',
    'onfocus',
    'oninput',
    'oninvalid',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'onload',
    'onloadeddata',
    'onloadedmetadata',
    'onloadstart',
    'onmousedown',
    'onmouseenter',
    'onmouseleave',
    'onmousemove',
    'onmouseout',
    'onmouseover',
    'onmouseup',
    'onmousewheel',
    'onpause',
    'onplay',
    'onplaying',
    'onprogress',
    'onratechange',
    'onreset',
    'onresize',
    'onscroll',
    'onseeked',
    'onseeking',
    'onselect',
    'onstalled',
    'onsubmit',
    'onsuspend',
    'ontimeupdate',
    'ontoggle',
    'onvolumechange',
    'onwaiting',
    'onwheel',
    'onauxclick',
    'ongotpointercapture',
    'onlostpointercapture',
    'onpointerdown',
    'onpointermove',
    'onpointerup',
    'onpointercancel',
    'onpointerover',
    'onpointerout',
    'onpointerenter',
    'onpointerleave',
    'onselectstart',
    'onselectionchange',
    'nonce',
    'click',
    'focus',
    'blur'
];
const ELEMENT_KEYS = [
    'namespaceURI',
    'prefix',
    'localName',
    'tagName',
    'id',
    'className',
    'classList',
    'slot',
    'attributes',
    'shadowRoot',
    'assignedSlot',
    'innerHTML',
    'outerHTML',
    'scrollTop',
    'scrollLeft',
    'scrollWidth',
    'scrollHeight',
    'clientTop',
    'clientLeft',
    'clientWidth',
    'clientHeight',
    'attributeStyleMap',
    'onbeforecopy',
    'onbeforecut',
    'onbeforepaste',
    'onsearch',
    'previousElementSibling',
    'nextElementSibling',
    'children',
    'firstElementChild',
    'lastElementChild',
    'childElementCount',
    'onfullscreenchange',
    'onfullscreenerror',
    'onwebkitfullscreenchange',
    'onwebkitfullscreenerror',
    'setPointerCapture',
    'releasePointerCapture',
    'hasPointerCapture',
    'hasAttributes',
    'getAttributeNames',
    'getAttribute',
    'getAttributeNS',
    'setAttribute',
    'setAttributeNS',
    'removeAttribute',
    'removeAttributeNS',
    'hasAttribute',
    'hasAttributeNS',
    'toggleAttribute',
    'getAttributeNode',
    'getAttributeNodeNS',
    'setAttributeNode',
    'setAttributeNodeNS',
    'removeAttributeNode',
    'closest',
    'matches',
    'webkitMatchesSelector',
    'attachShadow',
    'getElementsByTagName',
    'getElementsByTagNameNS',
    'getElementsByClassName',
    'insertAdjacentElement',
    'insertAdjacentText',
    'insertAdjacentHTML',
    'requestPointerLock',
    'getClientRects',
    'getBoundingClientRect',
    'scrollIntoView',
    'scroll',
    'scrollTo',
    'scrollBy',
    'scrollIntoViewIfNeeded',
    'animate',
    'computedStyleMap',
    'before',
    'after',
    'replaceWith',
    'remove',
    'prepend',
    'append',
    'querySelector',
    'querySelectorAll',
    'requestFullscreen',
    'webkitRequestFullScreen',
    'webkitRequestFullscreen',
    'part',
    'createShadowRoot',
    'getDestinationInsertionPoints'
];
const NODE_KEYS = [
    'ELEMENT_NODE',
    'ATTRIBUTE_NODE',
    'TEXT_NODE',
    'CDATA_SECTION_NODE',
    'ENTITY_REFERENCE_NODE',
    'ENTITY_NODE',
    'PROCESSING_INSTRUCTION_NODE',
    'COMMENT_NODE',
    'DOCUMENT_NODE',
    'DOCUMENT_TYPE_NODE',
    'DOCUMENT_FRAGMENT_NODE',
    'NOTATION_NODE',
    'DOCUMENT_POSITION_DISCONNECTED',
    'DOCUMENT_POSITION_PRECEDING',
    'DOCUMENT_POSITION_FOLLOWING',
    'DOCUMENT_POSITION_CONTAINS',
    'DOCUMENT_POSITION_CONTAINED_BY',
    'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC',
    'nodeType',
    'nodeName',
    'baseURI',
    'isConnected',
    'ownerDocument',
    'parentNode',
    'parentElement',
    'childNodes',
    'firstChild',
    'lastChild',
    'previousSibling',
    'nextSibling',
    'nodeValue',
    'textContent',
    'hasChildNodes',
    'getRootNode',
    'normalize',
    'cloneNode',
    'isEqualNode',
    'isSameNode',
    'compareDocumentPosition',
    'contains',
    'lookupPrefix',
    'lookupNamespaceURI',
    'isDefaultNamespace',
    'insertBefore',
    'appendChild',
    'replaceChild',
    'removeChild'
];
const JSX_KEYS = [
    'ref',
    'key'
];
const RESERVED_PUBLIC_MEMBERS = new Set([
    ...HTML_ELEMENT_KEYS,
    ...ELEMENT_KEYS,
    ...NODE_KEYS,
    ...JSX_KEYS
].map(p => p.toLowerCase()));
function isReservedMember(memberName) {
    memberName = memberName.toLowerCase();
    return RESERVED_PUBLIC_MEMBERS.has(memberName);
}

const rule$i = {
    meta: {
        docs: {
            description: 'This rule catches modules that expose more than just the Stencil Component itself.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        const parserServices = context.parserServices;
        const typeChecker = parserServices.program.getTypeChecker();
        return {
            'ClassDeclaration': (node) => {
                const component = getDecorator(node, 'Component');
                if (component) {
                    const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    const nonTypeExports = typeChecker.getExportsOfModule(typeChecker.getSymbolAtLocation(originalNode.getSourceFile()))
                        .filter(symbol => (symbol.flags & (ts__default.SymbolFlags.Interface | ts__default.SymbolFlags.TypeAlias)) === 0)
                        .filter(symbol => symbol.name !== originalNode.name.text);
                    nonTypeExports.forEach(symbol => {
                        const errorNode = (symbol.valueDeclaration)
                            ? parserServices.tsNodeToESTreeNodeMap.get(symbol.valueDeclaration).id
                            : parserServices.tsNodeToESTreeNodeMap.get(symbol.declarations[0]);
                        context.report({
                            node: errorNode,
                            message: `To allow efficient bundling, modules using @Component() can only have a single export which is the component class itself. Any other exports should be moved to a separate file. For further information check out: https://stenciljs.com/docs/module-bundling`
                        });
                    });
                }
            }
        };
    }
};

const mutableProps = new Map();
const rule$j = {
    meta: {
        docs: {
            description: 'This rule catches mutable Props that not need to be mutable.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'layout',
    },
    create(context) {
        const stencil = stencilComponentContext();
        function getMutable(node) {
            if (!stencil.isComponent()) {
                return;
            }
            const parsed = parseDecorator(node);
            const mutable = parsed && parsed.length && parsed[0].mutable || false;
            if (mutable) {
                const varName = node.parent.key.name;
                mutableProps.set(varName, node);
            }
        }
        function checkAssigment(node) {
            if (!stencil.isComponent()) {
                return;
            }
            const propName = node.left.property.name;
            mutableProps.delete(propName);
        }
        stencil.rules["ClassDeclaration:exit"];
        return {
            'ClassDeclaration': stencil.rules.ClassDeclaration,
            'ClassProperty > Decorator[expression.callee.name=Prop]': getMutable,
            'AssignmentExpression[left.object.type=ThisExpression][left.property.type=Identifier]': checkAssigment,
            'ClassDeclaration:exit': (node) => {
                const isCmp = stencil.isComponent();
                stencil.rules["ClassDeclaration:exit"](node);
                if (isCmp) {
                    mutableProps.forEach((varNode, varName) => {
                        context.report({
                            node: varNode.parent,
                            message: `@Prop() "${varName}" should not be mutable`,
                        });
                    });
                    mutableProps.clear();
                }
            }
        };
    }
};

const rule$k = {
    meta: {
        docs: {
            description: 'This rule catches function calls at the top level',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [
            {
                type: 'array',
                items: {
                    type: 'string'
                },
                minLength: 0,
                additionalProperties: false
            }
        ],
        type: 'suggestion'
    },
    create(context) {
        const shouldSkip = /\b(spec|e2e|test)\./.test(context.getFilename());
        const skipFunctions = context.options[0] || DEFAULTS$2;
        if (shouldSkip) {
            return {};
        }
        return {
            'CallExpression': (node) => {
                if (skipFunctions.includes(node.callee.name)) {
                    return;
                }
                if (!isInScope(node)) {
                    context.report({
                        node: node,
                        message: `Call expressions at the top-level should be avoided.`
                    });
                }
            }
        };
    }
};
const isInScope = (n) => {
    const type = n.type;
    if (type === 'ArrowFunctionExpression' ||
        type === 'FunctionDeclaration' ||
        type === 'ClassDeclaration' ||
        type === 'ExportNamedDeclaration') {
        return true;
    }
    n = n.parent;
    if (n) {
        return isInScope(n);
    }
    return false;
};
const DEFAULTS$2 = ['describe', 'test', 'bind', 'createStore'];

/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const OPTION_ALLOW_NULL_UNION = "allow-null-union";
const OPTION_ALLOW_UNDEFINED_UNION = "allow-undefined-union";
const OPTION_ALLOW_STRING = "allow-string";
const OPTION_ALLOW_ENUM = "allow-enum";
const OPTION_ALLOW_NUMBER = "allow-number";
const OPTION_ALLOW_MIX = "allow-mix";
const OPTION_ALLOW_BOOLEAN_OR_UNDEFINED = "allow-boolean-or-undefined";
const OPTION_ALLOW_ANY_RHS = "allow-any-rhs";
const rule$l = {
    meta: {
        docs: {
            description: `Restricts the types allowed in boolean expressions. By default only booleans are allowed.
      The following nodes are checked:
      * Arguments to the \`!\`, \`&&\`, and \`||\` operators
      * The condition in a conditional expression (\`cond ? x : y\`)
      * Conditions for \`if\`, \`for\`, \`while\`, and \`do-while\` statements.`,
            category: 'Possible Errors',
            recommended: true
        },
        schema: [{
                type: "array",
                items: {
                    type: "string",
                    enum: [
                        OPTION_ALLOW_NULL_UNION,
                        OPTION_ALLOW_UNDEFINED_UNION,
                        OPTION_ALLOW_STRING,
                        OPTION_ALLOW_ENUM,
                        OPTION_ALLOW_NUMBER,
                        OPTION_ALLOW_BOOLEAN_OR_UNDEFINED,
                        OPTION_ALLOW_ANY_RHS
                    ],
                },
                minLength: 0,
                maxLength: 5,
            }],
        type: 'problem'
    },
    create(context) {
        const parserServices = context.parserServices;
        const program = parserServices.program;
        const rawOptions = context.options[0] || ['allow-null-union', 'allow-undefined-union', 'allow-boolean-or-undefined'];
        const options = parseOptions(rawOptions, true);
        const checker = program.getTypeChecker();
        function walk(sourceFile) {
            ts.forEachChild(sourceFile, function cb(node) {
                switch (node.kind) {
                    case ts.SyntaxKind.PrefixUnaryExpression: {
                        const { operator, operand } = node;
                        if (operator === ts.SyntaxKind.ExclamationToken) {
                            checkExpression(operand, node);
                        }
                        break;
                    }
                    case ts.SyntaxKind.IfStatement:
                    case ts.SyntaxKind.WhileStatement:
                    case ts.SyntaxKind.DoStatement: {
                        const c = node;
                        // If it's a boolean binary expression, we'll check it when recursing.
                        checkExpression(c.expression, c);
                        break;
                    }
                    case ts.SyntaxKind.ConditionalExpression:
                        checkExpression(node.condition, node);
                        break;
                    case ts.SyntaxKind.ForStatement: {
                        const { condition } = node;
                        if (condition !== undefined) {
                            checkExpression(condition, node);
                        }
                    }
                }
                return ts.forEachChild(node, cb);
            });
            function checkExpression(node, location) {
                const type = checker.getTypeAtLocation(node);
                const failure = getTypeFailure(type, options);
                if (failure !== undefined) {
                    if (failure === 0 /* AlwaysTruthy */ &&
                        !options.strictNullChecks &&
                        (options.allowNullUnion || options.allowUndefinedUnion)) {
                        // OK; It might be null/undefined.
                        return;
                    }
                    const originalNode = parserServices.tsNodeToESTreeNodeMap.get(node);
                    context.report({
                        node: originalNode,
                        message: showFailure(location, failure, isUnionType(type), options),
                    });
                }
            }
        }
        return {
            'Program': (node) => {
                const sourceFile = parserServices.esTreeNodeToTSNodeMap.get(node);
                walk(sourceFile);
            }
        };
    }
};
function parseOptions(ruleArguments, strictNullChecks) {
    return {
        strictNullChecks,
        allowNullUnion: has(OPTION_ALLOW_NULL_UNION),
        allowUndefinedUnion: has(OPTION_ALLOW_UNDEFINED_UNION),
        allowString: has(OPTION_ALLOW_STRING),
        allowEnum: has(OPTION_ALLOW_ENUM),
        allowNumber: has(OPTION_ALLOW_NUMBER),
        allowMix: has(OPTION_ALLOW_MIX),
        allowBooleanOrUndefined: has(OPTION_ALLOW_BOOLEAN_OR_UNDEFINED),
        allowAnyRhs: has(OPTION_ALLOW_ANY_RHS),
    };
    function has(name) {
        return ruleArguments.indexOf(name) !== -1;
    }
}
function getTypeFailure(type, options) {
    if (isUnionType(type)) {
        return handleUnion(type, options);
    }
    const kind = getKind(type);
    const failure = failureForKind(kind, /*isInUnion*/ false, options);
    if (failure !== undefined) {
        return failure;
    }
    switch (triState(kind)) {
        case true:
            // Allow 'any'. Allow 'true' itself, but not any other always-truthy type.
            // tslint:disable-next-line no-bitwise
            return isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.BooleanLiteral) ? undefined : 0 /* AlwaysTruthy */;
        case false:
            // Allow 'false' itself, but not any other always-falsy type
            return isTypeFlagSet(type, ts.TypeFlags.BooleanLiteral) ? undefined : 1 /* AlwaysFalsy */;
        case undefined:
            return undefined;
    }
}
function isBooleanUndefined(type) {
    let isTruthy = false;
    for (const ty of type.types) {
        if (isTypeFlagSet(ty, ts.TypeFlags.Boolean)) {
            isTruthy = true;
        }
        else if (isTypeFlagSet(ty, ts.TypeFlags.BooleanLiteral)) {
            isTruthy = isTruthy || ty.intrinsicName === "true";
        }
        else if (!isTypeFlagSet(ty, ts.TypeFlags.Void | ts.TypeFlags.Undefined)) { // tslint:disable-line:no-bitwise
            return undefined;
        }
    }
    return isTruthy;
}
function handleUnion(type, options) {
    if (options.allowBooleanOrUndefined) {
        switch (isBooleanUndefined(type)) {
            case true:
                return undefined;
            case false:
                return 1 /* AlwaysFalsy */;
        }
    }
    for (const ty of type.types) {
        const kind = getKind(ty);
        const failure = failureForKind(kind, /*isInUnion*/ true, options);
        if (failure !== undefined) {
            return failure;
        }
    }
    return undefined;
}
/** Fails if a kind of falsiness is not allowed. */
function failureForKind(kind, isInUnion, options) {
    switch (kind) {
        case 0 /* String */:
        case 1 /* FalseStringLiteral */:
            return options.allowString ? undefined : 2 /* String */;
        case 2 /* Number */:
        case 3 /* FalseNumberLiteral */:
            return options.allowNumber ? undefined : 3 /* Number */;
        case 8 /* Enum */:
            return options.allowEnum ? undefined : 6 /* Enum */;
        case 10 /* Promise */:
            return 8 /* Promise */;
        case 6 /* Null */:
            return isInUnion && !options.allowNullUnion ? 4 /* Null */ : undefined;
        case 7 /* Undefined */:
            return isInUnion && !options.allowUndefinedUnion ? 5 /* Undefined */ : undefined;
        default:
            return undefined;
    }
}
/** Divides a type into always true, always false, or unknown. */
function triState(kind) {
    switch (kind) {
        case 0 /* String */:
        case 2 /* Number */:
        case 4 /* Boolean */:
        case 8 /* Enum */:
            return undefined;
        case 6 /* Null */:
        case 7 /* Undefined */:
        case 3 /* FalseNumberLiteral */:
        case 1 /* FalseStringLiteral */:
        case 5 /* FalseBooleanLiteral */:
            return false;
        case 9 /* AlwaysTruthy */:
        case 10 /* Promise */:
            return true;
    }
}
function getKind(type) {
    return is(ts.TypeFlags.StringLike) ? 0 /* String */ :
        is(ts.TypeFlags.NumberLike) ? 2 /* Number */ :
            is(ts.TypeFlags.Boolean) ? 4 /* Boolean */ :
                isObject('Promise') ? 10 /* Promise */ :
                    is(ts.TypeFlags.Null) ? 6 /* Null */ :
                        is(ts.TypeFlags.Undefined | ts.TypeFlags.Void) ? 7 /* Undefined */
                            :
                                is(ts.TypeFlags.EnumLike) ? 8 /* Enum */ :
                                    is(ts.TypeFlags.BooleanLiteral) ?
                                        (type.intrinsicName === "true" ? 9 /* AlwaysTruthy */ : 5 /* FalseBooleanLiteral */) :
                                        9 /* AlwaysTruthy */;
    function is(flags) {
        return isTypeFlagSet(type, flags);
    }
    function isObject(name) {
        const symbol = type.getSymbol();
        return (symbol && symbol.getName() === name);
    }
}
function binaryBooleanExpressionKind(node) {
    switch (node.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
            return "&&";
        case ts.SyntaxKind.BarBarToken:
            return "||";
        default:
            return undefined;
    }
}
function stringOr(parts) {
    switch (parts.length) {
        case 1:
            return parts[0];
        case 2:
            return `${parts[0]} or ${parts[1]}`;
        default:
            let res = "";
            for (let i = 0; i < parts.length - 1; i++) {
                res += `${parts[i]}, `;
            }
            return `${res}or ${parts[parts.length - 1]}`;
    }
}
function isUnionType(type) {
    return isTypeFlagSet(type, ts.TypeFlags.Union) && !isTypeFlagSet(type, ts.TypeFlags.Enum);
}
function showLocation(n) {
    switch (n.kind) {
        case ts.SyntaxKind.PrefixUnaryExpression:
            return "operand for the '!' operator";
        case ts.SyntaxKind.ConditionalExpression:
            return "condition";
        case ts.SyntaxKind.ForStatement:
            return "'for' condition";
        case ts.SyntaxKind.IfStatement:
            return "'if' condition";
        case ts.SyntaxKind.WhileStatement:
            return "'while' condition";
        case ts.SyntaxKind.DoStatement:
            return "'do-while' condition";
        case ts.SyntaxKind.BinaryExpression:
            return `operand for the '${binaryBooleanExpressionKind(n)}' operator`;
    }
}
function showFailure(location, ty, unionType, options) {
    const expectedTypes = showExpectedTypes(options);
    const expected = expectedTypes.length === 1 ?
        `Only ${expectedTypes[0]}s are allowed` :
        `Allowed types are ${stringOr(expectedTypes)}`;
    const tyFail = showTypeFailure(ty, unionType, options.strictNullChecks);
    return `This type is not allowed in the ${showLocation(location)} because it ${tyFail}. ${expected}.`;
}
function showExpectedTypes(options) {
    const parts = ["boolean"];
    if (options.allowNullUnion) {
        parts.push("null-union");
    }
    if (options.allowUndefinedUnion) {
        parts.push("undefined-union");
    }
    if (options.allowString) {
        parts.push("string");
    }
    if (options.allowEnum) {
        parts.push("enum");
    }
    if (options.allowNumber) {
        parts.push("number");
    }
    if (options.allowBooleanOrUndefined) {
        parts.push("boolean-or-undefined");
    }
    return parts;
}
function showTypeFailure(ty, unionType, strictNullChecks) {
    const is = unionType ? "could be" : "is";
    switch (ty) {
        case 0 /* AlwaysTruthy */:
            return strictNullChecks ?
                "is always truthy" :
                "is always truthy. It may be null/undefined, but neither " +
                    `'${OPTION_ALLOW_NULL_UNION}' nor '${OPTION_ALLOW_UNDEFINED_UNION}' is set`;
        case 1 /* AlwaysFalsy */:
            return "is always falsy";
        case 2 /* String */:
            return `${is} a string`;
        case 3 /* Number */:
            return `${is} a number`;
        case 4 /* Null */:
            return `${is} null`;
        case 5 /* Undefined */:
            return `${is} undefined`;
        case 6 /* Enum */:
            return `${is} an enum`;
        case 8 /* Promise */:
            return "promise handled as boolean expression";
        case 7 /* Mixes */:
            return "unions more than one truthy/falsy type";
    }
}
function isTypeFlagSet(obj, flag) {
    return (obj.flags & flag) !== 0;
}

const rule$m = {
    meta: {
        docs: {
            description: 'This rule catches exports of const enums',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        type: 'problem'
    },
    create(context) {
        return {
            'ExportNamedDeclaration > TSEnumDeclaration[const]': (node) => {
                context.report({
                    node: node,
                    message: `Exported const enums are not allowed`
                });
            }
        };
    }
};

const rule$n = {
    meta: {
        docs: {
            description: 'This rule can provide suggestions about dependencies in stencil apps',
            recommended: true
        },
        schema: [],
        type: 'suggestion',
    },
    create(context) {
        return {
            'ImportDeclaration': (node) => {
                const importName = node.source.value;
                const message = SUGGESTIONS[importName];
                if (message) {
                    context.report({
                        node,
                        message
                    });
                }
            }
        };
    }
};
const SUGGESTIONS = {
    'classnames': `Stencil can already render conditional classes:
  <div class={{disabled: condition}}>`,
    'lodash': `"lodash" will bloat your build, use "lodash-es" instead: https://www.npmjs.com/package/lodash-es`,
    'moment': `"moment" will bloat your build, use "dayjs", "date-fns" or other modern lightweight alternaitve`,
    'core-js': `Stencil already include the core-js polyfills only when needed`,
};

var index = {
    'ban-side-effects': rule$k,
    'ban-exported-const-enums': rule$m,
    'dependency-suggestions': rule$n,
    'strict-boolean-conditions': rule$l,
    'async-methods': rule,
    'ban-prefix': rule$1,
    'class-pattern': rule$2,
    'decorators-context': rule$3,
    'decorators-style': rule$4,
    'element-type': rule$5,
    'host-data-deprecated': rule$6,
    'methods-must-be-public': rule$7,
    'no-unused-watch': rule$8,
    'own-methods-must-be-private': rule$9,
    'own-props-must-be-private': rule$a,
    'prefer-vdom-listener': rule$b,
    'props-must-be-public': rule$c,
    'props-must-be-readonly': rule$d,
    'render-returns-host': rule$e,
    'required-jsdoc': rule$f,
    'required-prefix': rule$g,
    'reserved-member-names': rule$h,
    'single-export': rule$i,
    'strict-mutable': rule$j
};

var base = {
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2018,
                sourceType: 'module',
                ecmaFeatures: {
                    'jsx': true
                }
            },
            env: {
                es2020: true,
                browser: true,
            },
            plugins: [
                '@stencil'
            ],
            rules: {
                '@stencil/async-methods': 2,
                '@stencil/ban-prefix': [2, ['stencil', 'stnl', 'st']],
                '@stencil/decorators-context': 2,
                '@stencil/element-type': 2,
                '@stencil/host-data-deprecated': 2,
                '@stencil/methods-must-be-public': 2,
                '@stencil/no-unused-watch': 2,
                '@stencil/prefer-vdom-listener': 2,
                '@stencil/props-must-be-public': 2,
                '@stencil/render-returns-host': 2,
                '@stencil/reserved-member-names': 2,
                '@stencil/single-export': 2,
            }
        }
    ]
};

var recommended = {
    plugins: [
        "react"
    ],
    extends: [
        "plugin:@stencil/base",
    ],
    rules: {
        '@stencil/strict-boolean-conditions': 1,
        '@stencil/ban-exported-const-enums': 2,
        // '@stencil/ban-side-effects': 2,
        '@stencil/strict-mutable': 2,
        '@stencil/decorators-style': [
            'error', {
                prop: 'inline',
                state: 'inline',
                element: 'inline',
                event: 'inline',
                method: 'multiline',
                watch: 'multiline',
                listen: 'multiline'
            }
        ],
        '@stencil/own-methods-must-be-private': 1,
        '@stencil/own-props-must-be-private': 1,
        '@stencil/dependency-suggestions': 1,
        '@stencil/required-jsdoc': 1,
        "react/jsx-no-bind": [1, {
                "ignoreRefs": true
            }]
    }
};

var strict = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@stencil/recommended",
    ],
    rules: {
        '@stencil/strict-boolean-conditions': 2,
        // Resets
        "@typescript-eslint/camelcase": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/ban-ts-ignore": 0,
        "@typescript-eslint/no-this-alias": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-empty-interface": 0,
        "@typescript-eslint/no-use-before-define": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "no-constant-condition": 0,
        // Best practices
        "no-shadow": 2,
        "no-var": 2,
        "prefer-object-spread": 2,
        "no-nested-ternary": 2,
        "no-duplicate-imports": 2,
        // General formatting
        "indent": [2, 2],
        "no-trailing-spaces": 2,
        "curly": [2, "all"],
        "comma-spacing": 2,
        "comma-style": 2,
        "computed-property-spacing": 2,
        "comma-dangle": [2, {
                'objects': 'always-multiline'
            }],
        "func-style": [2, "expression", { "allowArrowFunctions": true }],
        "multiline-ternary": [2, "always-multiline"],
        "operator-linebreak": [2, "after", { "overrides": { "?": "before", ":": "before" } }],
        "linebreak-style": 2,
        "space-in-parens": 2,
        "@typescript-eslint/semi": 2,
        "@typescript-eslint/brace-style": 2,
        "@typescript-eslint/func-call-spacing": 2,
        // JSX formatting
        "react/jsx-closing-tag-location": 2,
        "react/jsx-curly-newline": [2, "never"],
        "react/jsx-closing-bracket-location": 2,
        "react/jsx-curly-spacing": [2, { "when": "never", "children": true }],
        "react/jsx-boolean-value": [2, "never"],
        "react/jsx-child-element-spacing": 2,
        "react/jsx-indent-props": [2, "first"],
        "react/jsx-props-no-multi-spaces": 2,
        "react/jsx-equals-spacing": [2, "never"],
    }
};

var index$1 = {
    base,
    recommended,
    strict
};

exports.configs = index$1;
exports.rules = index;
