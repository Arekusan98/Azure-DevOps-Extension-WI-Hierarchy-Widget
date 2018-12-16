/// <reference path='isettings.d.ts' />
"use strict";
import RestClient = require("TFS/Work/RestClient");
import CoreClient = require("TFS/Core/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");

export class Configuration {
    widgetConfigurationContext = null;

    $wiid = $("#wiid");
    $expandtree = $("#expand-tree");
    $firstasheader = $("#firstasheader");
    public client = RestClient.getClient();
    public clientwi = RestClientWI.getClient();
    public clickOnSave = false;
    public expandtree: boolean = false;
    public firstasheader: boolean = false;

    public _widgetHelpers;
    constructor(public WidgetHelpers) {
    }

    public load(widgetSettings, widgetConfigurationContext) {

        let _that = this;

        let $wiid = $("#wiid");
        this.widgetConfigurationContext = widgetConfigurationContext;

        let $errorSingleLineInput = $("#linewi .validation-error-text");

        let settings = JSON.parse(widgetSettings.customSettings.data);
        console.log(settings);
        if (settings && settings.wiId) {
            $wiid.val(settings.wiId);
            _that.expandtree = settings.expandtree;
            _that.firstasheader = settings.parentwiasheader;
        } else {
            // first load
            $wiid.val("");
        }

        _that.$wiid.blur(() => {
            this.clientwi.getWorkItem($wiid.val()).then((wi) => {

                $errorSingleLineInput.parent().css("visibility", "hidden");

                _that.widgetConfigurationContext.notify(_that.WidgetHelpers.WidgetEvent.ConfigurationChange,
                    _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings()));

            }, (reject) => {
                if (reject.status = "404") {
                    $errorSingleLineInput.text("This Work item dosn't exist.");
                    $errorSingleLineInput.parent().css("visibility", "visible");
                    $(".btn-cta").attr("disabled", "disabled");

                    return _that.WidgetHelpers.WidgetStatusHelper.Failure();

                }
            });
        });

        _that.$expandtree.prop("checked", _that.expandtree);
        _that.$firstasheader.prop("checked", _that.firstasheader);

        this.ExpandTreeStatus();
        this.FirstAsHeaderStatus();

        _that.$expandtree.change(() => {
            this.ExpandTreeStatus();

            let eventName = _that.WidgetHelpers.WidgetEvent.ConfigurationChange;
            let eventArgs = _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings());
            _that.widgetConfigurationContext.notify(eventName, eventArgs);
        });

        _that.$firstasheader.change(() => {
            this.FirstAsHeaderStatus();

            let eventName = _that.WidgetHelpers.WidgetEvent.ConfigurationChange;
            let eventArgs = _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings());
            _that.widgetConfigurationContext.notify(eventName, eventArgs);
        });
        return _that.WidgetHelpers.WidgetStatusHelper.Success();
    }

    private isValidWI(): IPromise<boolean> {
        let deferred = $.Deferred<boolean>();

        if ($("#wiid").val() !== "") {
            this.clientwi.getWorkItem($("#wiid").val()).then((wi) => {
                deferred.resolve(true);
            }, (reject) => {
                if (reject.status = "404") {
                    deferred.resolve(false);
                }
            });
        } else {
            deferred.resolve(false);
        }

        return deferred.promise();
    }

    public getCustomSettings() {
        let expandtree = $("#expand-tree").is(":checked");
        let firstasheader = $("#firstasheader").is(":checked");
        let result = { data: JSON.stringify(<ISettings>{ wiId: $("#wiid").val(), expandtree: expandtree, parentwiasheader: firstasheader }) };
        return result;
    }

    public onSave() {

        if ($("#wiid").val() !== "") {
            let customSettings = this.getCustomSettings();
            return this.WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);

        } else {
            let $errorSingleLineInput = $("#linewi .validation-error-text");
            $errorSingleLineInput.text("This Work item Id is required");
            $errorSingleLineInput.parent().css("visibility", "visible");
            return this.WidgetHelpers.WidgetConfigurationSave.Invalid();
        }
    }

    public ExpandTreeStatus() {
        let expandtree = $("#expand-tree").is(":checked");
        let expandtreestatus = $("#expandtree-status");
        if (expandtree) {
            expandtreestatus.text("On");
        } else {
            expandtreestatus.text("Off");
        }
    }

    public FirstAsHeaderStatus() {
        let firstasheader = $("#firstasheader").is(":checked");
        let firstasheaderstatus = $("#firstasheader-status");
        if (firstasheader) {
            firstasheaderstatus.text("On");
        } else {
            firstasheaderstatus.text("Off");
        }
    }
}

VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers) => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    VSS.register("backlogitemhierarchy-Configuration", () => {
        let configuration = new Configuration(WidgetHelpers);
        return configuration;
    });

    VSS.notifyLoadSucceeded();
});