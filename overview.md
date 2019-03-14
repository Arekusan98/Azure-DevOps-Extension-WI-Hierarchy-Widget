## Azure DevOps Extension Backlog Hierarchy Widget ##

The **Backlog Item Hierarchy Widget** display an childs hierarchical view of any given Work item.

![](/static/images/Screen1.png)

### Quick steps to get started ###

#### Method 1 ####

- Edit your dashboard ![edit dashboard](/static/images/edit-dashboard.png)
- Select and Add the 'Backlog Item hierarchy' widget
    ![add widget](/static/images/widget-catalog.png)
- Configure the widget
    ![configure widget](/static/images/config-widget.png)
- In the configuration panel, enter the Id of the Parent Work item [1], you can also select an appropriate size [2]
    ![configure widget item](/static/images/config-widget2.png)
- Save the widget configuration panel

#### Method 2 ####

- Select the context menu on any work item list, work item dialog, or board [1]
- Select the item 'Pin backlog item hierarchy to dashboard' [2]
- Select the desired dashboard [3]
    ![Add to dashboard](/static/images/add-dashboard.png)

The widget will be directly added to your dashboard

### Others Widget configuration ###

![config options](/static/images/config-options.png)

#### Expand Tree ####

By default the backlog item hierarchy tree is fully open: all nodes are unfolded.
Checking the option Expand Tree [1] for add the collapse/expand feature on grid.

![collapse](/static/images/collapse-nodes.png)

#### Root work item as title ####

By default the title of the Widget is defined on the configuration panel.
Checking the option Root Work Item as Title [2] display the name of the parent work item as title of the widget.

![title](/static/images/title-wi.png)

### Known issue(s)

- You can't open or close a node in configuration mode.
- Only the default theme is supported

### Learn More

The [source](https://github.com/Cellenza/Azure-DevOps-Extension-WI-Hierarchy-Widget) to this extension is available. Feel free to take, fork, and extend.


### Minimum supported environments ###

- Azure DevOps

### Contributors ###

We thank the following contributor(s) for this extension: [Mikael Krief](https://github.com/mikaelkrief), [Michel Perfetti](https://github.com/miiitch)
