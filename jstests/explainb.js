// nscanned and nscannedObjects report results for the winning plan; nscannedAllPlans and
// nscannedObjectsAllPlans report results for all plans.  SERVER-6268

t = db.jstests_explainb;
t.drop();

t.ensureIndex( { a:1, b:1 } );
t.ensureIndex( { b:1, a:1 } );

t.save( { a:0, b:1 } );
t.save( { a:1, b:0 } );

explain = t.find( { a:{ $gte:0 }, b:{ $gte:0 } } ).explain( true );

// The a:1,b:1 plan finishes scanning first.
assert.eq( 'IndexCursor a_1_b_1', explain.cursor );
assert.eq( 2, explain.n );
// nscanned and nscannedObjects are reported for the a:1,b:1 plan.
assert.eq( 2, explain.nscanned );
assert.eq( 2, explain.nscannedObjects );
// nscannedAllPlans and nscannedObjectsAllPlans report the combined total of all plans.
assert.eq( 6, explain.nscannedAllPlans );
assert.eq( 6, explain.nscannedObjectsAllPlans );

// A limit of 2.
explain = t.find( { a:{ $gte:0 }, b:{ $gte:0 } } ).limit( -2 ).explain( true );

assert.eq( 'IndexCursor a_1_b_1', explain.cursor );
assert.eq( 2, explain.n );
assert.eq( 1, explain.nscanned );
assert.eq( 1, explain.nscannedObjects );
// The first result was identified for each plan.
assert.eq( 3, explain.nscannedAllPlans );
// One result was retrieved from each of the two indexed plans.
assert.eq( 2, explain.nscannedObjectsAllPlans );

// A $or query.
explain = t.find( { $or:[ { a:{ $gte:0 }, b:{ $gte:1 } },
                          { a:{ $gte:1 }, b:{ $gte:0 } } ] } ).explain( true );
assert.eq( 1, explain.clauses[ 0 ].n );
assert.eq( 1, explain.clauses[ 0 ].nscannedObjects );
assert.eq( 2, explain.clauses[ 0 ].nscanned );
assert.eq( 3, explain.clauses[ 0 ].nscannedObjectsAllPlans );
assert.eq( 4, explain.clauses[ 0 ].nscannedAllPlans );
assert.eq( 1, explain.clauses[ 1 ].n );
assert.eq( 1, explain.clauses[ 1 ].nscannedObjects );
assert.eq( 1, explain.clauses[ 1 ].nscanned );
assert.eq( 3, explain.clauses[ 1 ].nscannedObjectsAllPlans );
assert.eq( 3, explain.clauses[ 1 ].nscannedAllPlans );
assert.eq( 2, explain.n );

// These are computed by summing the values for each clause.
assert.eq( 2, explain.n );
assert.eq( 2, explain.nscannedObjects );
assert.eq( 3, explain.nscanned );
assert.eq( 6, explain.nscannedObjectsAllPlans );
assert.eq( 7, explain.nscannedAllPlans );

// A non $or case where nscanned != nscannedObjects.
t.remove();

t.save( { a:'0', b:'1' } );
t.save( { a:'1', b:'0' } );

explain = t.find( { a:/0/, b:/1/ } ).explain( true );

assert.eq( 'IndexCursor a_1_b_1 multi', explain.cursor );
assert.eq( 1, explain.n );
assert.eq( 2, explain.nscanned );
assert.eq( 1, explain.nscannedObjects );
// Two results were scanned for each plan.
assert.eq( 6, explain.nscannedAllPlans );
// The indexed plans each loaded one matching object, the unindexed plan loaded two.
assert.eq( 4, explain.nscannedObjectsAllPlans );
