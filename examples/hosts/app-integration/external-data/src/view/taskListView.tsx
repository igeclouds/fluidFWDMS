/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { CollaborativeInput } from "@fluid-experimental/react-inputs";

import React, { useEffect, useRef, useState } from "react";

import type { ITask, ITaskList } from "../model-interface";

interface ITaskRowProps {
	readonly task: ITask;
	readonly deleteTask: () => void;
    readonly isLeader: boolean;
}

/**
 * The view for a single task in the TaskListView, as a table row.
 */
const TaskRow: React.FC<ITaskRowProps> = (props: ITaskRowProps) => {
	const { task, deleteTask, isLeader } = props;
	const priorityRef = useRef<HTMLInputElement>(null);
	const [externalName, setExternalName] = useState<string | undefined>(task.externalName);
	const [externalPriority, setExternalPriority] = useState<number | undefined>(
		task.externalPriority,
	);
	const [changeType, setChangeType] = useState<string | undefined>(task.changeType);
	useEffect(() => {
		const updateFromRemotePriority = (): void => {
			if (priorityRef.current !== null) {
				priorityRef.current.value = task.priority.toString();
			}
		};
		const showExternalPriority = (): void => {
            if (isLeader) {
                setExternalPriority(task.externalPriority);
            } else {
                setExternalName("External Name Changed");
            }
			setChangeType(task.changeType);
		};
		const showExternalName = (): void => {
            if (isLeader) {
                setExternalName(task.externalName)
            } else {
                setExternalName("External Name Changed");
            }
			setChangeType(task.changeType);
		};
		task.on("priorityChanged", updateFromRemotePriority);
		task.on("externalPriorityChanged", showExternalPriority);
		task.on("externalNameChanged", showExternalName);
		updateFromRemotePriority();
		return (): void => {
			task.off("priorityChanged", updateFromRemotePriority);
			task.off("externalPriorityChanged", showExternalPriority);
			task.off("externalNameChanged", showExternalName);
		};
	}, [task, externalName, externalPriority, changeType]);

	const inputHandler = (e: React.FormEvent): void => {
		const newValue = Number.parseInt((e.target as HTMLInputElement).value, 10);
		task.priority = newValue;
	};

     console.log(isLeader);

	const diffVisible = changeType !== undefined;
	const showPriority = diffVisible && externalPriority !== undefined ? "visible" : "hidden";
	const showName = diffVisible && externalName !== undefined ? "visible" : "hidden";
	const showAcceptButton = isLeader && diffVisible ? "visible" : "hidden" ;

	let diffColor: string = "white";
	switch (changeType) {
		case "add": {
			diffColor = "green";
			break;
		}
		case "delete": {
			diffColor = "red";
			break;
		}
		default: {
			diffColor = "orange";
			break;
		}
	}

	return (
		<tr>
			<td>{task.id}</td>
			<td>
				<CollaborativeInput
					sharedString={task.name}
					style={{ width: "200px" }}
				></CollaborativeInput>
			</td>
			<td>
				<input
					ref={priorityRef}
					onInput={inputHandler}
					type="number"
					style={{ width: "50px" }}
				></input>
			</td>
			<td>
				<button onClick={deleteTask} style={{ background: "none", border: "none" }}>
					❌
				</button>
			</td>
			<td style={{ visibility: showName, backgroundColor: diffColor }}>{externalName}</td>
			<td style={{ visibility: showPriority, backgroundColor: diffColor }}>
				{externalPriority}
			</td>
			<td>
				<button
					onClick={task.overwriteWithExternalData}
					style={{ visibility: showAcceptButton }}
				>
					Accept change
				</button>
			</td>
		</tr>
	);
};

/**
 * {@link TaskListView} input props.
 */
export interface ITaskListViewProps {
	readonly taskList: ITaskList;
    readonly isLeader: boolean;
}

/**
 * A tabular, editable view of the task list.  Includes a save button to sync the changes back to the data source.
 */
export const TaskListView: React.FC<ITaskListViewProps> = (props: ITaskListViewProps) => {
	const { taskList, isLeader } = props;

	const [tasks, setTasks] = useState<ITask[]>(taskList.getTasks());
	useEffect(() => {
		const updateTasks = (): void => {
			setTasks(taskList.getTasks());
		};
		taskList.on("taskAdded", updateTasks);
		taskList.on("taskDeleted", updateTasks);

		return (): void => {
			taskList.off("taskAdded", updateTasks);
			taskList.off("taskDeleted", updateTasks);
		};
	}, [taskList]);

	const taskRows = tasks.map((task: ITask) => (
		<TaskRow key={task.id} task={task} deleteTask={(): void => taskList.deleteTask(task.id)} isLeader={isLeader} />
	));

	return (
		// TODO: Gray button if not "authenticated" via debug controls
		// TODO: Conflict UI
		<div>
			<h2 style={{ textDecoration: "underline" }}>Client App</h2>
			<table>
				<thead>
					<tr>
						<td>ID</td>
						<td>Title</td>
						<td>Priority</td>
					</tr>
				</thead>
				<tbody>{taskRows}</tbody>
			</table>
			{isLeader && <button onClick={taskList.saveChanges}>Save changes</button>}
		</div>
	);
};
