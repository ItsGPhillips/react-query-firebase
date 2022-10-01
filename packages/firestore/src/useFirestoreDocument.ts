/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
  FirestoreError,
} from "firebase/firestore";
import {
  getSnapshot,
  isSnapshotListenOptions,
  isSnapshotOptions,
  SnapshotListenOptionsHelper,
  UseFirestoreHookOptions,
} from "./index";
import { useSubscription } from "../../utils/src/useSubscription";
import { useCallback, useMemo } from "react";

type NextOrObserver<T> = (data: DocumentSnapshot<T> | null) => Promise<void>;

export function useFirestoreDocument<T = DocumentData, R = DocumentSnapshot<T>>(
  queryKey: QueryKey,
  ref: DocumentReference<T>,
  options: UseFirestoreHookOptions = {},
  useQueryOptions?: Omit<
    UseQueryOptions<DocumentSnapshot<T>, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const subscribeFn = useCallback(
    (callback: NextOrObserver<T>) => {
      return onSnapshot(
        ref,
        SnapshotListenOptionsHelper(options),
        (snapshot: DocumentSnapshot<T>) => {
          // Set the data each time state changes.
          return callback(snapshot);
        }
      );
    },
    [ref]
  );

  const memoedOptions = useMemo(() => {
    if (isSnapshotListenOptions(options)) {
      return {
        ...useQueryOptions,
      };
    }

    if (isSnapshotOptions(options)) {
      return {
        ...useQueryOptions,
        onlyOnce: !options.subscribe,
        fetchFn: async () => {
          if (isSnapshotListenOptions(options)) {
          }
          return getSnapshot(ref, options?.source);
        },
      };
    }
  }, [options.subscribe]);

  return useSubscription<DocumentSnapshot<T>, FirestoreError, R>(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    memoedOptions
  );
}
