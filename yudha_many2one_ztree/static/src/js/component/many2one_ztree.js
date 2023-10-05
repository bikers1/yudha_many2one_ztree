/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

export class FieldZTree extends Many2OneField {

    setup() {
        super.setup(...arguments)
    }
}

registry.category("fields").add("ztree_select", FieldZTree);
