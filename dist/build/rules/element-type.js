import { getDecorator, getType, parseDecorator, stencilComponentContext } from '../utils';
const rule = {
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
export default rule;
