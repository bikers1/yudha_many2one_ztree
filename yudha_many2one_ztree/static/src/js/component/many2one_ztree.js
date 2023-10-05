/** @odoo-module **/


import { registry } from "@web/core/registry";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

export class FieldZTreeMany2one extends Many2OneField {
    setup() {
        super.setup();
    }
}
FieldZTreeMany2one.additionalClasses = ['o_field_many2one'];
registry.category("fields").add("ztree_select", FieldZTreeMany2one);
