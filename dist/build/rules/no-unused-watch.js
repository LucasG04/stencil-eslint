import { stencilComponentContext } from '../utils';
const varsList = new Set();
const rule = {
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
export default rule;
