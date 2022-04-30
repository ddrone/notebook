import * as m from 'mithril';

interface ListNode {
    text: string;
    edited: boolean;
    children: List|null;
}

interface List {
    nodes: ListNode[];
}

export class ListComponent implements m.ClassComponent {
    list: List;
    editedNode: ListNode;

    constructor() {
        this.editedNode = {
            text: '',
            edited: true,
            children: null
        };
        this.list = {
            nodes: [this.editedNode]
        };
    }

    renderList(list: List): m.Children {
        return m('ul',
            list.nodes.map(node => m('li', this.renderNode(node)))
        );
    }

    renderNode(item: ListNode): m.Children {
        if (item.edited) {
            return m('input', {
                value: item.text
            });
        }

        if (item.children == null) {
            return item.text;
        }

        return [
            item.text,
            this.renderList(item.children)
        ];
    }

    view() {
        return this.renderList(this.list);
    }
}
