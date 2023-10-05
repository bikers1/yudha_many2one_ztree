/** @odoo-module **/


import { registry } from "@web/core/registry";
import { X2ManyField } from "@web/views/fields/x2many/x2many_field";

export class FieldZTreeChart extends X2ManyField {
    setup() {
        super.setup();
    }
}

registry.category("fields").add("ztree_chart", FieldZTreeChart);
