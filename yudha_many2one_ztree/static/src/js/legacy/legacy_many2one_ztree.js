/** @odoo-module **/

    import { FieldMany2One } from 'web.relational_fields';
    import FieldRegistry from 'web.field_registry';
    import core from "web.core";
    import { SelectCreateDialog } from "@web/views/view_dialogs/select_create_dialog";
    import { Component } from "@odoo/owl";
    import AbstractField from 'web.AbstractField';
    import  zTree  from "yudha_many2one_ztree.zTree";
    const qweb = core.qweb;
    const _t = core._t;
    const _lt = core._lt;

    const FieldZTreeMany2one = FieldMany2One.extend({
        supportedFieldTypes: ['many2one'],
        template: 'App.FieldZtree',
        SEARCH_MORE_LIMIT: 1000,

        init: function () {
            alert('testing ')
            this._super.apply(this, arguments);
            this.limit = this.attrs.limit ? this.attrs.limit : 1000;
            this.nodeOptions.quick_create = false;
            this.nodeOptions.no_quick_create = true;
            this.ztree_parent_key = this.nodeOptions.ztree_parent_key;
            this.ztree_root_id = this.nodeOptions.ztree_root_id;
            this.ztree_name_field = this.nodeOptions.ztree_name_field;
            this.order = this.nodeOptions.order;
            this.ztree_expend_level = this.nodeOptions.ztree_expend_level;
        },
        start: function () {
            this._super.apply(this, arguments);
            var self = this;
            $(document).delegate('body', 'click', function (ev) {
                var $parent = $(ev.target).parents('.o_input_dropdown')
                if (!$parent.length && self.many2one) {
                    self._close();
                } else if (!$parent.find('.ztree').length) {
                    self._close();
                }
            });
        },
        _bindAutoComplete: function () {
            var self = this;
            this._super.apply(this, arguments);
            this.$input.autocomplete({
                source: function (req) {
                    if (!self.many2one)
                        self.buildTreeView(req.term);
                },
                focus: function (event, ui) {
                    event.preventDefault(); // don't automatically select values on focus
                },
                close: function (event, ui) {
                    if (event.which === $.ui.keyCode.ESCAPE) {
                        event.stopPropagation();
                    }
                    console.log('ui close');
                },
                autoFocus: true,
                html: true,
                minLength: 0,
                delay: this.AUTOCOMPLETE_DELAY,
            });

            this.$input.autocomplete("option", "position", {my: "left top", at: "left bottom"});
        },
        _selectNode: function (event, item) {
            var self = this;
            self.$input.autocomplete("close");
            event.stopImmediatePropagation();
            event.preventDefault();
            event.stopPropagation();
            self.floating = false;
            if (item.id) {
                self.reinitialize({id: item.id, display_name: item.name});
            } else if (item.action) {
                item.action();
            }
            self._close();
            return false;
        },
        _onInputClick: function (ev) {
            this._super.apply(this, arguments);
            var $parent = $(ev.target).parents('.o_input_dropdown')
            if ($parent.find('.ztree').length && this.many2one) {
                this._close();
            }
        },
        _onInputKeyup: function (ev) {
            this._super.apply(this, arguments);
            if (event.which === $.ui.keyCode.ESCAPE) {
                event.stopPropagation();
                this._close();
            } else
                this.buildTreeView(ev.target.value);
        },
        _onInputFocusout: function () {
            ;
        },
        _close: function () {
            var self = this;
            if (self.many2one)
                self.many2one.destroy();
            try {
                self.many2one.$el.remove();
            } catch (err) {
                ;
            }
            self.many2one = undefined;
        },
        _search: function (search_val) {
            var self = this;

            var def = new Promise(function (resolve, reject) {
                var context = self.record.getContext(self.recordParams);
                var domain = self.record.getDomain(self.recordParams);

                // Add the additionalContext
                _.extend(context, self.additionalContext);

                var blacklisted_ids = self._getSearchBlacklist();
                if (blacklisted_ids.length > 0) {
                    domain.push(['id', 'not in', blacklisted_ids]);
                }
                if (search_val && search_val != "") {
                    domain.push(['name', 'ilike', search_val]);
                }

                var parent_key = self.ztree_parent_key;
                var root_id = self.ztree_root_id;
                var expend_level = self.ztree_expend_level;
                var name_field = self.ztree_name_field;
                self._rpc({
                    model: self.field.relation,
                    method: "search_ztree",
                    kwargs: {
                        domain: domain,
                        context: context,
                        parent_key: parent_key,
                        root_id: root_id,
                        expend_level: expend_level,
                        name_field: name_field,
                        limit: parseInt(self.limit + 1),
                        order: self.order,
                    }
                })
                    .then(function (result) {
                        var values = result;
                        // search more... if more results than limit
                        if (values.length > self.limit) {
                            values = self._manageSearchMore(values, search_val, domain, context);
                        }
                        var create_enabled = self.can_create && !self.nodeOptions.no_create;
                        // quick create，默认关闭
                        var raw_result = _.map(result, function (x) { return x[1]; });

                        if (create_enabled && !self.nodeOptions.no_quick_create &&
                            search_val.length > 0 && !_.contains(raw_result, search_val)) {
                            values.push({
                                id: null,
                                name: _.str.sprintf(_t('Create "<strong>%s</strong>"'),
                                    $('<span />').text(search_val).html()),
                                font: {'color': '#00A09D', 'font-weight': 'bold'},
                                label: _.str.sprintf(_t('Create "<strong>%s</strong>"'),
                                    $('<span />').text(search_val).html()),
                                action: self._quickCreate.bind(self, search_val),
                                classname: 'o_m2o_dropdown_option'
                            });
                        }
                        // create and edit ...
                        if (create_enabled && !self.nodeOptions.no_create_edit) {
                            var createAndEditAction = function () {
                                // Clear the value in case the user clicks on discard
                                self.$('input').val('');
                                return self._searchCreatePopup("form", false, self._createContext(search_val));
                            };
                            values.push({
                                id: null,
                                name: _t("Create and Edit..."),
                                font: {'color': '#00A09D', 'font-weight': 'bold'},
                                label: _t("Create and Edit..."),
                                action: createAndEditAction,
                                classname: 'o_m2o_dropdown_option',
                            });
                        } else if (values.length === 0) {
                            values.push({
                                id: null,
                                name: _t("No results to show..."),
                                font: {'color': '#00A09D', 'font-weight': 'bold'},
                                label: _t("No results to show..."),
                            });
                        }
                        resolve(values);
                    });
            });
            this.orderer.add(def);
            return def;
        },
        buildTreeView: function (search_val) {
            var self = this;
            var domain = self.record.getDomain(self.recordParams);

            var blacklisted_ids = self._getSearchBlacklist();
            if (blacklisted_ids.length > 0) {
                domain.push(['id', 'not in', blacklisted_ids]);
            }
            if (self.many2one) {
                self.many2one.destroy();
                self.many2one = undefined;
            }
            var setting = {
                callback: {
                    onClick: function (event, treeId, treeNode, clickFlag) {
                        self._selectNode(event, treeNode);
                    }
                }
            };
            self._search(search_val).then(function (result) {
                //todo: 不能默认让node selected，会出现quick_create 混乱
                if (self.value && self.value.data.id && self.value.data.id > 0)
                    var ztree_selected_id = self.value.data.id;
                self.many2one = new zTree(setting, {
                    zNodes: result,
                    ztree_domain: domain,
                    ztree_field: self.field.name,
                    ztree_model: self.field.relation,
                    ztree_parent_key: self.ztree_parent_key,
                    ztree_root_id: self.ztree_root_id,
                    ztree_expend_level: self.ztree_expend_level,
                    ztree_name_field: self.ztree_name_field,
                    ztree_selected_id: ztree_selected_id,
                });
                self.many2one.appendTo(self.$input.parent());
                // self.$(".ztree").replaceWith(self.many2one);
                self.$input.css('height', 'auto');
            });
        },
    });
    FieldRegistry.add('ztree_select', FieldZTreeMany2one);
    export default FieldZTreeMany2one;