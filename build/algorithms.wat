(module
 (type $0 (func (param i32 i32) (result f64)))
 (type $1 (func (param f64 f64) (result f64)))
 (type $2 (func (param f64) (result f64)))
 (type $3 (func (param i32 i32 f64 i32)))
 (type $4 (func (param i32 i32 i32)))
 (type $5 (func (param i32) (result i32)))
 (type $6 (func (param i32 i32 f64)))
 (type $7 (func))
 (type $8 (func (param i32 i32 i32 i32)))
 (type $9 (func (param f64 i32) (result f64)))
 (type $10 (func (param i32 i32 f64) (result i32)))
 (type $11 (func (param i32 i32 f64 f64 f64 f64 f64 i32)))
 (global $assembly/index/heapOffset (mut i32) (i32.const 1024))
 (memory $0 64 256)
 (export "allocateF64Array" (func $assembly/index/allocateF64Array))
 (export "setF64" (func $assembly/index/setF64))
 (export "getF64" (func $assembly/index/getF64))
 (export "resetHeap" (func $assembly/index/resetHeap))
 (export "linearRegression" (func $assembly/index/linearRegression))
 (export "calculateStandardDeviation" (func $assembly/index/calculateStandardDeviation))
 (export "calculateRSquared" (func $assembly/index/calculateRSquared))
 (export "calculateChannelScore" (func $assembly/index/calculateChannelScore))
 (export "calculateCVaRPenalty" (func $assembly/index/calculateCVaRPenalty))
 (export "saturate" (func $assembly/index/saturate))
 (export "detectFrequency" (func $assembly/index/detectFrequency))
 (export "calculateSuperAI_v2" (func $assembly/index/calculateSuperAI_v2))
 (export "calculateUltraSmoothV2" (func $assembly/index/calculateUltraSmoothV2))
 (export "calculateSuperAI_v1" (func $assembly/index/calculateSuperAI_v1))
 (export "calculateUltraSmoothV1" (func $assembly/index/calculateUltraSmoothV1))
 (export "calculateUltraSmoothV3" (func $assembly/index/calculateUltraSmoothV3))
 (export "memory" (memory $0))
 (func $assembly/index/allocateF64Array (param $0 i32) (result i32)
  (local $1 i32)
  global.get $assembly/index/heapOffset
  local.set $1
  global.get $assembly/index/heapOffset
  local.get $0
  i32.const 3
  i32.shl
  i32.add
  global.set $assembly/index/heapOffset
  local.get $1
 )
 (func $assembly/index/setF64 (param $0 i32) (param $1 i32) (param $2 f64)
  local.get $0
  local.get $1
  i32.const 3
  i32.shl
  i32.add
  local.get $2
  f64.store
 )
 (func $assembly/index/getF64 (param $0 i32) (param $1 i32) (result f64)
  local.get $0
  local.get $1
  i32.const 3
  i32.shl
  i32.add
  f64.load
 )
 (func $assembly/index/resetHeap
  i32.const 1024
  global.set $assembly/index/heapOffset
 )
 (func $assembly/index/linearRegression (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32)
  (local $4 f64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  loop $for-loop|0
   local.get $1
   local.get $5
   i32.gt_s
   if
    local.get $4
    local.get $5
    f64.convert_i32_s
    local.tee $10
    f64.add
    local.set $4
    local.get $6
    local.get $0
    local.get $5
    call $assembly/index/getF64
    local.tee $9
    f64.add
    local.set $6
    local.get $7
    local.get $10
    local.get $9
    f64.mul
    f64.add
    local.set $7
    local.get $8
    local.get $10
    local.get $10
    f64.mul
    f64.add
    local.set $8
    local.get $5
    i32.const 1
    i32.add
    local.set $5
    br $for-loop|0
   end
  end
  local.get $2
  local.get $1
  f64.convert_i32_s
  local.tee $9
  local.get $7
  f64.mul
  local.get $4
  local.get $6
  f64.mul
  f64.sub
  local.get $9
  local.get $8
  f64.mul
  local.get $4
  local.get $4
  f64.mul
  f64.sub
  f64.div
  local.tee $7
  f64.store
  local.get $3
  local.get $6
  local.get $7
  local.get $4
  f64.mul
  f64.sub
  local.get $9
  f64.div
  f64.store
 )
 (func $assembly/index/calculateStandardDeviation (param $0 i32) (param $1 i32) (result f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  local.get $1
  i32.eqz
  if
   f64.const 0
   return
  end
  loop $for-loop|0
   local.get $1
   local.get $3
   i32.gt_s
   if
    local.get $2
    local.get $0
    local.get $3
    call $assembly/index/getF64
    f64.add
    local.set $2
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|0
   end
  end
  local.get $2
  local.get $1
  f64.convert_i32_s
  f64.div
  local.set $2
  loop $for-loop|1
   local.get $1
   local.get $4
   i32.gt_s
   if
    local.get $5
    local.get $0
    local.get $4
    call $assembly/index/getF64
    local.get $2
    f64.sub
    local.tee $5
    local.get $5
    f64.mul
    f64.add
    local.set $5
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|1
   end
  end
  local.get $5
  local.get $1
  f64.convert_i32_s
  f64.div
  f64.sqrt
 )
 (func $~lib/math/NativeMath.log (param $0 f64) (result f64)
  (local $1 i32)
  (local $2 i64)
  (local $3 f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $2
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $1
  i32.const 31
  i32.shr_u
  local.tee $4
  local.get $1
  i32.const 1048576
  i32.lt_u
  i32.or
  if
   local.get $2
   i64.const 1
   i64.shl
   i64.eqz
   if
    f64.const -1
    local.get $0
    local.get $0
    f64.mul
    f64.div
    return
   end
   local.get $4
   if
    local.get $0
    local.get $0
    f64.sub
    f64.const 0
    f64.div
    return
   end
   i32.const -54
   local.set $5
   local.get $0
   f64.const 18014398509481984
   f64.mul
   i64.reinterpret_f64
   local.tee $2
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $1
  else
   local.get $1
   i32.const 2146435072
   i32.ge_u
   if
    local.get $0
    return
   else
    local.get $2
    i64.const 32
    i64.shl
    i64.eqz
    local.get $1
    i32.const 1072693248
    i32.eq
    i32.and
    if
     f64.const 0
     return
    end
   end
  end
  local.get $2
  i64.const 4294967295
  i64.and
  local.get $1
  i32.const 614242
  i32.add
  local.tee $1
  i32.const 1048575
  i32.and
  i32.const 1072079006
  i32.add
  i64.extend_i32_u
  i64.const 32
  i64.shl
  i64.or
  f64.reinterpret_i64
  f64.const -1
  f64.add
  local.tee $7
  f64.const 0.5
  f64.mul
  local.get $7
  f64.mul
  local.set $0
  local.get $7
  local.get $7
  f64.const 2
  f64.add
  f64.div
  local.tee $8
  local.get $8
  f64.mul
  local.tee $3
  local.get $3
  f64.mul
  local.set $6
  local.get $8
  local.get $0
  local.get $3
  local.get $6
  local.get $6
  local.get $6
  f64.const 0.14798198605116586
  f64.mul
  f64.const 0.1818357216161805
  f64.add
  f64.mul
  f64.const 0.2857142874366239
  f64.add
  f64.mul
  f64.const 0.6666666666666735
  f64.add
  f64.mul
  local.get $6
  local.get $6
  local.get $6
  f64.const 0.15313837699209373
  f64.mul
  f64.const 0.22222198432149784
  f64.add
  f64.mul
  f64.const 0.3999999999940942
  f64.add
  f64.mul
  f64.add
  f64.add
  f64.mul
  local.get $5
  local.get $1
  i32.const 20
  i32.shr_s
  i32.const 1023
  i32.sub
  i32.add
  f64.convert_i32_s
  local.tee $3
  f64.const 1.9082149292705877e-10
  f64.mul
  f64.add
  local.get $0
  f64.sub
  local.get $7
  f64.add
  local.get $3
  f64.const 0.6931471803691238
  f64.mul
  f64.add
 )
 (func $assembly/index/calculateRSquared (param $0 i32) (param $1 i32) (result f64)
  (local $2 f64)
  (local $3 f64)
  (local $4 i32)
  (local $5 f64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  (local $11 f64)
  local.get $1
  i32.const 2
  i32.lt_s
  if
   f64.const 0
   return
  end
  loop $for-loop|0
   local.get $1
   local.get $4
   i32.gt_s
   if
    local.get $3
    local.get $4
    f64.convert_i32_s
    local.tee $11
    f64.add
    local.set $3
    local.get $2
    local.get $0
    local.get $4
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    if (result f64)
     local.get $2
     call $~lib/math/NativeMath.log
    else
     f64.const 0
    end
    local.tee $10
    f64.add
    local.set $2
    local.get $5
    local.get $11
    local.get $10
    f64.mul
    f64.add
    local.set $5
    local.get $8
    local.get $11
    local.get $11
    f64.mul
    f64.add
    local.set $8
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|0
   end
  end
  local.get $2
  local.get $1
  f64.convert_i32_s
  local.tee $10
  local.get $5
  f64.mul
  local.get $3
  local.get $2
  f64.mul
  f64.sub
  local.get $10
  local.get $8
  f64.mul
  local.get $3
  local.get $3
  f64.mul
  f64.sub
  f64.div
  local.tee $5
  local.get $3
  f64.mul
  f64.sub
  local.get $10
  f64.div
  local.set $3
  local.get $2
  local.get $10
  f64.div
  local.set $2
  loop $for-loop|1
   local.get $1
   local.get $6
   i32.gt_s
   if
    local.get $7
    local.get $0
    local.get $6
    call $assembly/index/getF64
    local.tee $7
    f64.const 0
    f64.gt
    if (result f64)
     local.get $7
     call $~lib/math/NativeMath.log
    else
     f64.const 0
    end
    local.tee $8
    local.get $2
    f64.sub
    local.tee $7
    local.get $7
    f64.mul
    f64.add
    local.set $7
    local.get $9
    local.get $8
    local.get $3
    local.get $5
    local.get $6
    f64.convert_i32_s
    f64.mul
    f64.add
    f64.sub
    local.tee $8
    local.get $8
    f64.mul
    f64.add
    local.set $9
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|1
   end
  end
  f64.const 1
  local.get $9
  local.get $7
  f64.div
  f64.sub
  f64.const 0
  local.get $7
  f64.const 0
  f64.gt
  select
 )
 (func $~lib/math/NativeMath.scalbn (param $0 f64) (param $1 i32) (result f64)
  local.get $1
  i32.const 1023
  i32.gt_s
  if (result f64)
   local.get $0
   f64.const 8988465674311579538646525e283
   f64.mul
   local.set $0
   local.get $1
   i32.const 1023
   i32.sub
   local.tee $1
   i32.const 1023
   i32.gt_s
   if (result f64)
    i32.const 1023
    local.get $1
    i32.const 1023
    i32.sub
    local.tee $1
    local.get $1
    i32.const 1023
    i32.ge_s
    select
    local.set $1
    local.get $0
    f64.const 8988465674311579538646525e283
    f64.mul
   else
    local.get $0
   end
  else
   local.get $1
   i32.const -1022
   i32.lt_s
   if (result f64)
    local.get $0
    f64.const 2.004168360008973e-292
    f64.mul
    local.set $0
    local.get $1
    i32.const 969
    i32.add
    local.tee $1
    i32.const -1022
    i32.lt_s
    if (result f64)
     i32.const -1022
     local.get $1
     i32.const 969
     i32.add
     local.tee $1
     local.get $1
     i32.const -1022
     i32.le_s
     select
     local.set $1
     local.get $0
     f64.const 2.004168360008973e-292
     f64.mul
    else
     local.get $0
    end
   else
    local.get $0
   end
  end
  local.get $1
  i64.extend_i32_s
  i64.const 1023
  i64.add
  i64.const 52
  i64.shl
  f64.reinterpret_i64
  f64.mul
 )
 (func $~lib/math/NativeMath.exp (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 f64)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 i32)
  local.get $0
  i64.reinterpret_f64
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $7
  i32.const 31
  i32.shr_u
  local.set $4
  local.get $7
  i32.const 2147483647
  i32.and
  local.tee $7
  i32.const 1082532651
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.ne
   if
    local.get $0
    return
   end
   local.get $0
   f64.const 709.782712893384
   f64.gt
   if
    local.get $0
    f64.const 8988465674311579538646525e283
    f64.mul
    return
   end
   local.get $0
   f64.const -745.1332191019411
   f64.lt
   if
    f64.const 0
    return
   end
  end
  local.get $7
  i32.const 1071001154
  i32.gt_u
  if
   local.get $0
   local.get $0
   f64.const 1.4426950408889634
   f64.mul
   f64.const 0.5
   local.get $0
   f64.copysign
   f64.add
   i32.trunc_sat_f64_s
   i32.const 1
   local.get $4
   i32.const 1
   i32.shl
   i32.sub
   local.get $7
   i32.const 1072734898
   i32.ge_u
   select
   local.tee $2
   f64.convert_i32_s
   f64.const 0.6931471803691238
   f64.mul
   f64.sub
   local.tee $1
   local.get $2
   f64.convert_i32_s
   f64.const 1.9082149292705877e-10
   f64.mul
   local.tee $5
   f64.sub
   local.set $0
  else
   local.get $7
   i32.const 1043333120
   i32.gt_u
   if (result f64)
    local.get $0
   else
    local.get $0
    f64.const 1
    f64.add
    return
   end
   local.set $1
  end
  local.get $0
  local.get $0
  f64.mul
  local.tee $6
  local.get $6
  f64.mul
  local.set $3
  local.get $0
  local.get $0
  local.get $6
  f64.const 0.16666666666666602
  f64.mul
  local.get $3
  local.get $6
  f64.const 6.613756321437934e-05
  f64.mul
  f64.const -2.7777777777015593e-03
  f64.add
  local.get $3
  local.get $6
  f64.const 4.1381367970572385e-08
  f64.mul
  f64.const -1.6533902205465252e-06
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.sub
  local.tee $0
  f64.mul
  f64.const 2
  local.get $0
  f64.sub
  f64.div
  local.get $5
  f64.sub
  local.get $1
  f64.add
  f64.const 1
  f64.add
  local.set $0
  local.get $2
  if (result f64)
   local.get $0
   local.get $2
   call $~lib/math/NativeMath.scalbn
  else
   local.get $0
  end
 )
 (func $assembly/index/calculateChannelScore (param $0 i32) (param $1 i32) (result f64)
  (local $2 f64)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 i32)
  (local $8 i32)
  (local $9 f64)
  (local $10 f64)
  loop $for-loop|0
   local.get $1
   local.get $8
   i32.gt_s
   if
    local.get $10
    local.get $8
    f64.convert_i32_s
    local.tee $4
    f64.add
    local.set $10
    local.get $9
    local.get $0
    local.get $8
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    if (result f64)
     local.get $2
     call $~lib/math/NativeMath.log
    else
     f64.const 0
    end
    local.tee $2
    f64.add
    local.set $9
    local.get $6
    local.get $4
    local.get $2
    f64.mul
    f64.add
    local.set $6
    local.get $5
    local.get $4
    local.get $4
    f64.mul
    f64.add
    local.set $5
    local.get $8
    i32.const 1
    i32.add
    local.set $8
    br $for-loop|0
   end
  end
  local.get $9
  local.get $1
  f64.convert_i32_s
  local.tee $2
  local.get $6
  f64.mul
  local.get $10
  local.get $9
  f64.mul
  f64.sub
  local.get $2
  local.get $5
  f64.mul
  local.get $10
  local.get $10
  f64.mul
  f64.sub
  f64.div
  local.tee $5
  local.get $10
  f64.mul
  f64.sub
  local.get $2
  f64.div
  local.set $4
  loop $for-loop|1
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $3
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    if (result f64)
     local.get $2
     call $~lib/math/NativeMath.log
    else
     f64.const 0
    end
    local.get $4
    local.get $5
    local.get $7
    f64.convert_i32_s
    f64.mul
    f64.add
    f64.sub
    f64.abs
    local.tee $2
    f64.lt
    if
     local.get $2
     local.set $3
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|1
   end
  end
  local.get $3
  call $~lib/math/NativeMath.exp
  f64.const -1
  f64.add
  f64.const 2
  f64.mul
  f64.const -0.1
  f64.div
  call $~lib/math/NativeMath.exp
 )
 (func $assembly/index/calculateCVaRPenalty (param $0 i32) (param $1 i32) (result f64)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 i32)
  (local $7 f64)
  local.get $1
  i32.eqz
  if
   f64.const 1
   return
  end
  local.get $1
  call $assembly/index/allocateF64Array
  local.set $2
  loop $for-loop|0
   local.get $1
   local.get $3
   i32.gt_s
   if
    local.get $2
    local.get $3
    local.get $0
    local.get $3
    call $assembly/index/getF64
    call $assembly/index/setF64
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|0
   end
  end
  loop $for-loop|1
   local.get $4
   local.get $1
   i32.const 1
   i32.sub
   i32.lt_s
   if
    i32.const 0
    local.set $0
    loop $for-loop|2
     local.get $0
     local.get $1
     local.get $4
     i32.sub
     i32.const 1
     i32.sub
     i32.lt_s
     if
      local.get $2
      local.get $0
      call $assembly/index/getF64
      local.get $2
      local.get $0
      i32.const 1
      i32.add
      local.tee $3
      call $assembly/index/getF64
      f64.gt
      if
       local.get $2
       local.get $0
       call $assembly/index/getF64
       local.set $7
       local.get $2
       local.get $0
       local.get $2
       local.get $3
       call $assembly/index/getF64
       call $assembly/index/setF64
       local.get $2
       local.get $3
       local.get $7
       call $assembly/index/setF64
      end
      local.get $0
      i32.const 1
      i32.add
      local.set $0
      br $for-loop|2
     end
    end
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|1
   end
  end
  local.get $1
  f64.convert_i32_s
  f64.const 0.05
  f64.mul
  local.tee $7
  f64.const 1
  f64.lt
  if (result f64)
   f64.const 1
  else
   local.get $7
  end
  i32.trunc_sat_f64_s
  local.set $0
  loop $for-loop|3
   local.get $0
   local.get $6
   i32.gt_s
   if
    local.get $5
    local.get $2
    local.get $6
    call $assembly/index/getF64
    f64.add
    local.set $5
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|3
   end
  end
  local.get $5
  local.get $0
  f64.convert_i32_s
  f64.div
  f64.const 10
  f64.mul
  call $~lib/math/NativeMath.exp
 )
 (func $assembly/index/saturate (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  local.get $0
  local.get $1
  f64.add
  f64.div
  f64.const 0
  local.get $0
  f64.const 0
  f64.gt
  select
 )
 (func $assembly/index/detectFrequency (param $0 i32) (param $1 i32) (param $2 f64) (result i32)
  (local $3 f64)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 i32)
  local.get $2
  f64.const 0
  f64.gt
  if
   local.get $1
   f64.convert_i32_s
   local.get $2
   f64.div
   local.tee $2
   f64.const 4
   f64.gt
   if
    i32.const 0
    return
   end
   local.get $2
   f64.const 0.8
   f64.gt
   if
    i32.const 1
    return
   end
   local.get $2
   f64.const 0.15
   f64.gt
   if
    i32.const 2
    return
   end
   i32.const 3
   return
  end
  i32.const 1
  local.set $7
  loop $for-loop|0
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.set $5
    local.get $0
    local.get $7
    i32.const 1
    i32.sub
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    local.get $5
    f64.const 0
    f64.gt
    i32.and
    if
     local.get $6
     local.get $5
     local.get $2
     f64.div
     call $~lib/math/NativeMath.log
     f64.add
     local.set $6
     local.get $4
     i32.const 1
     i32.add
     local.set $4
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|0
   end
  end
  local.get $4
  i32.eqz
  if
   i32.const 1
   return
  end
  local.get $6
  local.get $4
  f64.convert_i32_s
  f64.div
  local.set $6
  i32.const 1
  local.set $7
  loop $for-loop|1
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.set $5
    local.get $0
    local.get $7
    i32.const 1
    i32.sub
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    local.get $5
    f64.const 0
    f64.gt
    i32.and
    if
     local.get $3
     local.get $5
     local.get $2
     f64.div
     call $~lib/math/NativeMath.log
     local.get $6
     f64.sub
     local.tee $2
     local.get $2
     f64.mul
     f64.add
     local.set $3
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|1
   end
  end
  local.get $3
  local.get $4
  f64.convert_i32_s
  f64.div
  f64.sqrt
  local.tee $2
  f64.const 0.008
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $2
  f64.const 0.025
  f64.lt
  if
   i32.const 1
   return
  end
  local.get $2
  f64.const 0.05
  f64.lt
  if
   i32.const 2
   return
  end
  i32.const 3
 )
 (func $assembly/index/max (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  local.get $1
  local.get $0
  local.get $1
  f64.gt
  select
 )
 (func $~lib/math/NativeMath.pow (param $0 f64) (param $1 f64) (result f64)
  (local $2 i32)
  (local $3 f64)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  (local $11 i64)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 f64)
  (local $17 f64)
  (local $18 f64)
  (local $19 f64)
  (local $20 f64)
  (local $21 f64)
  local.get $1
  f64.abs
  f64.const 2
  f64.le
  if
   local.get $1
   f64.const 2
   f64.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $1
   f64.const 0.5
   f64.eq
   if
    local.get $0
    f64.sqrt
    f64.abs
    f64.const inf
    local.get $0
    f64.const -inf
    f64.ne
    select
    return
   end
   local.get $1
   f64.const -1
   f64.eq
   if
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $1
   f64.const 1
   f64.eq
   if
    local.get $0
    return
   end
   local.get $1
   f64.const 0
   f64.eq
   if
    f64.const 1
    return
   end
  end
  local.get $0
  i64.reinterpret_f64
  local.tee $11
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $6
  i32.const 2147483647
  i32.and
  local.set $2
  local.get $1
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $12
  i32.const 2147483647
  i32.and
  local.tee $13
  local.get $5
  i32.wrap_i64
  local.tee $8
  i32.or
  i32.eqz
  if
   f64.const 1
   return
  end
  local.get $13
  i32.const 2146435072
  i32.eq
  local.get $8
  i32.const 0
  i32.ne
  i32.and
  local.get $2
  i32.const 2146435072
  i32.eq
  local.get $11
  i32.wrap_i64
  local.tee $7
  i32.const 0
  i32.ne
  i32.and
  local.get $2
  i32.const 2146435072
  i32.gt_s
  i32.or
  local.get $13
  i32.const 2146435072
  i32.gt_u
  i32.or
  i32.or
  if
   local.get $0
   local.get $1
   f64.add
   return
  end
  local.get $6
  i32.const 0
  i32.lt_s
  if (result i32)
   local.get $13
   i32.const 1128267776
   i32.ge_u
   if (result i32)
    i32.const 2
   else
    local.get $13
    i32.const 1072693248
    i32.ge_u
    if (result i32)
     i32.const 52
     i32.const 20
     local.get $13
     i32.const 20
     i32.shr_u
     i32.const 1023
     i32.sub
     local.tee $9
     i32.const 20
     i32.gt_s
     local.tee $14
     select
     local.get $9
     i32.sub
     local.set $15
     i32.const 2
     local.get $8
     local.get $13
     local.get $14
     select
     local.tee $14
     local.get $15
     i32.shr_u
     local.tee $9
     i32.const 1
     i32.and
     i32.sub
     i32.const 0
     local.get $9
     local.get $15
     i32.shl
     local.get $14
     i32.eq
     select
    else
     i32.const 0
    end
   end
  else
   i32.const 0
  end
  local.set $9
  local.get $8
  i32.eqz
  if
   local.get $13
   i32.const 2146435072
   i32.eq
   if
    local.get $1
    f64.const 0
    local.get $12
    i32.const 0
    i32.ge_s
    local.tee $4
    select
    f64.const 0
    local.get $1
    f64.neg
    local.get $4
    select
    local.get $2
    i32.const 1072693248
    i32.ge_s
    select
    f64.const nan:0x8000000000000
    local.get $2
    i32.const 1072693248
    i32.sub
    local.get $7
    i32.or
    select
    return
   end
   local.get $13
   i32.const 1072693248
   i32.eq
   if
    local.get $12
    i32.const 0
    i32.ge_s
    if
     local.get $0
     return
    end
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $12
   i32.const 1073741824
   i32.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $12
   i32.const 1071644672
   i32.eq
   local.get $6
   i32.const 0
   i32.ge_s
   i32.and
   if
    local.get $0
    f64.sqrt
    return
   end
  end
  local.get $0
  f64.abs
  local.set $3
  local.get $7
  i32.eqz
  local.get $2
  i32.eqz
  local.get $2
  i32.const 2146435072
  i32.eq
  i32.or
  local.get $2
  i32.const 1072693248
  i32.eq
  i32.or
  i32.and
  if
   f64.const 1
   local.get $3
   f64.div
   local.get $3
   local.get $12
   i32.const 0
   i32.lt_s
   select
   local.set $0
   local.get $6
   i32.const 0
   i32.lt_s
   if (result f64)
    local.get $2
    i32.const 1072693248
    i32.sub
    local.get $9
    i32.or
    if (result f64)
     local.get $0
     f64.neg
     local.get $0
     local.get $9
     i32.const 1
     i32.eq
     select
    else
     local.get $0
     local.get $0
     f64.sub
     local.tee $0
     local.get $0
     f64.div
    end
   else
    local.get $0
   end
   return
  end
  local.get $6
  i32.const 0
  i32.lt_s
  if (result f64)
   local.get $9
   i32.eqz
   if
    local.get $0
    local.get $0
    f64.sub
    local.tee $0
    local.get $0
    f64.div
    return
   end
   f64.const -1
   f64.const 1
   local.get $9
   i32.const 1
   i32.eq
   select
  else
   f64.const 1
  end
  local.set $16
  local.get $13
  i32.const 1105199104
  i32.gt_u
  if (result f64)
   local.get $13
   i32.const 1139802112
   i32.gt_u
   if
    local.get $2
    i32.const 1072693247
    i32.le_s
    if
     f64.const inf
     f64.const 0
     local.get $12
     i32.const 0
     i32.lt_s
     select
     return
    end
    local.get $2
    i32.const 1072693248
    i32.ge_s
    if
     f64.const inf
     f64.const 0
     local.get $12
     i32.const 0
     i32.gt_s
     select
     return
    end
   end
   local.get $2
   i32.const 1072693247
   i32.lt_s
   if
    local.get $16
    f64.const 1.e+300
    f64.mul
    f64.const 1.e+300
    f64.mul
    local.get $16
    f64.const 1e-300
    f64.mul
    f64.const 1e-300
    f64.mul
    local.get $12
    i32.const 0
    i32.lt_s
    select
    return
   end
   local.get $2
   i32.const 1072693248
   i32.gt_s
   if
    local.get $16
    f64.const 1.e+300
    f64.mul
    f64.const 1.e+300
    f64.mul
    local.get $16
    f64.const 1e-300
    f64.mul
    f64.const 1e-300
    f64.mul
    local.get $12
    i32.const 0
    i32.gt_s
    select
    return
   end
   local.get $3
   f64.const -1
   f64.add
   local.tee $0
   f64.const 1.4426950216293335
   f64.mul
   local.tee $3
   local.get $0
   f64.const 1.9259629911266175e-08
   f64.mul
   local.get $0
   local.get $0
   f64.mul
   f64.const 0.5
   local.get $0
   f64.const 0.3333333333333333
   local.get $0
   f64.const 0.25
   f64.mul
   f64.sub
   f64.mul
   f64.sub
   f64.mul
   f64.const 1.4426950408889634
   f64.mul
   f64.sub
   local.tee $10
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.set $0
   local.get $10
   local.get $0
   local.get $3
   f64.sub
   f64.sub
  else
   local.get $2
   i32.const 1048576
   i32.lt_s
   if
    i32.const -53
    local.set $4
    local.get $3
    f64.const 9007199254740992
    f64.mul
    local.tee $3
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.set $2
   end
   local.get $4
   local.get $2
   i32.const 20
   i32.shr_s
   i32.const 1023
   i32.sub
   i32.add
   local.set $4
   local.get $2
   i32.const 1048575
   i32.and
   local.tee $6
   i32.const 1072693248
   i32.or
   local.set $2
   local.get $6
   i32.const 235662
   i32.le_u
   if (result i32)
    i32.const 0
   else
    local.get $6
    i32.const 767610
    i32.lt_u
    if (result i32)
     i32.const 1
    else
     local.get $4
     i32.const 1
     i32.add
     local.set $4
     local.get $2
     i32.const -1048576
     i32.add
     local.set $2
     i32.const 0
    end
   end
   local.set $6
   local.get $3
   i64.reinterpret_f64
   i64.const 4294967295
   i64.and
   local.get $2
   i64.extend_i32_s
   i64.const 32
   i64.shl
   i64.or
   f64.reinterpret_i64
   local.tee $17
   f64.const 1.5
   f64.const 1
   local.get $6
   select
   local.tee $18
   f64.sub
   local.tee $19
   f64.const 1
   local.get $17
   local.get $18
   f64.add
   f64.div
   local.tee $0
   f64.mul
   local.tee $20
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $21
   local.get $21
   f64.mul
   local.set $3
   local.get $21
   local.get $3
   f64.const 3
   f64.add
   local.get $20
   local.get $20
   f64.mul
   local.tee $10
   local.get $10
   f64.mul
   local.get $10
   local.get $10
   local.get $10
   local.get $10
   local.get $10
   f64.const 0.20697501780033842
   f64.mul
   f64.const 0.23066074577556175
   f64.add
   f64.mul
   f64.const 0.272728123808534
   f64.add
   f64.mul
   f64.const 0.33333332981837743
   f64.add
   f64.mul
   f64.const 0.4285714285785502
   f64.add
   f64.mul
   f64.const 0.5999999999999946
   f64.add
   f64.mul
   local.get $0
   local.get $19
   local.get $21
   local.get $2
   i32.const 1
   i32.shr_s
   i32.const 536870912
   i32.or
   i32.const 524288
   i32.add
   local.get $6
   i32.const 18
   i32.shl
   i32.add
   i64.extend_i32_s
   i64.const 32
   i64.shl
   f64.reinterpret_i64
   local.tee $0
   f64.mul
   f64.sub
   local.get $21
   local.get $17
   local.get $0
   local.get $18
   f64.sub
   f64.sub
   f64.mul
   f64.sub
   f64.mul
   local.tee $0
   local.get $21
   local.get $20
   f64.add
   f64.mul
   f64.add
   local.tee $10
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $17
   f64.mul
   local.tee $18
   local.get $0
   local.get $17
   f64.mul
   local.get $10
   local.get $17
   f64.const -3
   f64.add
   local.get $3
   f64.sub
   f64.sub
   local.get $20
   f64.mul
   f64.add
   local.tee $0
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $3
   f64.const 0.9617967009544373
   f64.mul
   local.set $10
   local.get $3
   f64.const -7.028461650952758e-09
   f64.mul
   local.get $0
   local.get $3
   local.get $18
   f64.sub
   f64.sub
   f64.const 0.9617966939259756
   f64.mul
   f64.add
   f64.const 1.350039202129749e-08
   f64.const 0
   local.get $6
   select
   f64.add
   local.tee $0
   local.get $10
   local.get $0
   f64.add
   f64.const 0.5849624872207642
   f64.const 0
   local.get $6
   select
   local.tee $3
   f64.add
   local.get $4
   f64.convert_i32_s
   local.tee $17
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $0
   local.get $17
   f64.sub
   local.get $3
   f64.sub
   local.get $10
   f64.sub
   f64.sub
  end
  local.set $3
  local.get $1
  local.get $1
  i64.reinterpret_f64
  i64.const -4294967296
  i64.and
  f64.reinterpret_i64
  local.tee $10
  f64.sub
  local.get $0
  f64.mul
  local.get $1
  local.get $3
  f64.mul
  f64.add
  local.tee $1
  local.get $10
  local.get $0
  f64.mul
  local.tee $0
  f64.add
  local.tee $3
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $2
  local.get $5
  i32.wrap_i64
  local.set $4
  block $folding-inner1
   block $folding-inner0
    local.get $2
    i32.const 1083179008
    i32.ge_s
    if
     local.get $2
     i32.const 1083179008
     i32.sub
     local.get $4
     i32.or
     local.get $1
     f64.const 8.008566259537294e-17
     f64.add
     local.get $3
     local.get $0
     f64.sub
     f64.gt
     i32.or
     br_if $folding-inner0
    else
     local.get $2
     i32.const 2147483647
     i32.and
     i32.const 1083231232
     i32.ge_u
     i32.const 0
     local.get $2
     i32.const 1064252416
     i32.add
     local.get $4
     i32.or
     local.get $1
     local.get $3
     local.get $0
     f64.sub
     f64.le
     i32.or
     select
     br_if $folding-inner1
    end
    local.get $2
    i32.const 2147483647
    i32.and
    local.tee $6
    i32.const 20
    i32.shr_u
    i32.const 1023
    i32.sub
    local.set $7
    i32.const 0
    local.set $4
    local.get $6
    i32.const 1071644672
    i32.gt_u
    if
     i32.const 1048575
     local.get $2
     i32.const 1048576
     local.get $7
     i32.const 1
     i32.add
     i32.shr_s
     i32.add
     local.tee $4
     i32.const 2147483647
     i32.and
     i32.const 20
     i32.shr_u
     i32.const 1023
     i32.sub
     local.tee $6
     i32.shr_s
     i32.const -1
     i32.xor
     local.get $4
     i32.and
     i64.extend_i32_s
     i64.const 32
     i64.shl
     f64.reinterpret_i64
     local.set $3
     i32.const 0
     local.get $4
     i32.const 1048575
     i32.and
     i32.const 1048576
     i32.or
     i32.const 20
     local.get $6
     i32.sub
     i32.shr_s
     local.tee $4
     i32.sub
     local.get $4
     local.get $2
     i32.const 0
     i32.lt_s
     select
     local.set $4
     local.get $0
     local.get $3
     f64.sub
     local.set $0
    end
    local.get $1
    local.get $0
    f64.add
    i64.reinterpret_f64
    i64.const -4294967296
    i64.and
    f64.reinterpret_i64
    local.tee $3
    f64.const 0.6931471824645996
    f64.mul
    local.tee $10
    local.get $1
    local.get $3
    local.get $0
    f64.sub
    f64.sub
    f64.const 0.6931471805599453
    f64.mul
    local.get $3
    f64.const -1.904654299957768e-09
    f64.mul
    f64.add
    local.tee $0
    f64.add
    local.tee $1
    local.get $1
    f64.mul
    local.set $3
    local.get $16
    f64.const 1
    local.get $1
    local.get $1
    local.get $3
    local.get $3
    local.get $3
    local.get $3
    local.get $3
    f64.const 4.1381367970572385e-08
    f64.mul
    f64.const -1.6533902205465252e-06
    f64.add
    f64.mul
    f64.const 6.613756321437934e-05
    f64.add
    f64.mul
    f64.const -2.7777777777015593e-03
    f64.add
    f64.mul
    f64.const 0.16666666666666602
    f64.add
    f64.mul
    f64.sub
    local.tee $3
    f64.mul
    local.get $3
    f64.const -2
    f64.add
    f64.div
    local.get $0
    local.get $1
    local.get $10
    f64.sub
    f64.sub
    local.tee $0
    local.get $1
    local.get $0
    f64.mul
    f64.add
    f64.sub
    local.get $1
    f64.sub
    f64.sub
    local.tee $0
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.get $4
    i32.const 20
    i32.shl
    i32.add
    local.tee $2
    i32.const 20
    i32.shr_s
    i32.const 0
    i32.le_s
    if (result f64)
     local.get $0
     local.get $4
     call $~lib/math/NativeMath.scalbn
    else
     local.get $0
     i64.reinterpret_f64
     i64.const 4294967295
     i64.and
     local.get $2
     i64.extend_i32_s
     i64.const 32
     i64.shl
     i64.or
     f64.reinterpret_i64
    end
    f64.mul
    return
   end
   local.get $16
   f64.const 1.e+300
   f64.mul
   f64.const 1.e+300
   f64.mul
   return
  end
  local.get $16
  f64.const 1e-300
  f64.mul
  f64.const 1e-300
  f64.mul
 )
 (func $assembly/index/pow (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  local.get $1
  call $~lib/math/NativeMath.pow
 )
 (func $assembly/index/calculateSuperAI_v2 (param $0 i32) (param $1 i32) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 i32)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  (local $11 i32)
  (local $12 i32)
  (local $13 f64)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 f64)
  (local $21 i32)
  (local $22 f64)
  (local $23 f64)
  (local $24 f64)
  loop $for-loop|0
   local.get $11
   i32.const 9
   i32.lt_s
   if
    local.get $7
    local.get $11
    f64.const 0
    call $assembly/index/setF64
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    br $for-loop|0
   end
  end
  block $folding-inner1
   block $folding-inner0
    local.get $1
    i32.const 2
    i32.lt_s
    br_if $folding-inner0
    local.get $0
    local.get $1
    local.get $2
    call $assembly/index/detectFrequency
    local.tee $11
    if (result f64)
     local.get $11
     i32.const 1
     i32.eq
     if (result f64)
      f64.const 0.05
      local.set $13
      f64.const 252
     else
      local.get $11
      i32.const 2
      i32.eq
      if (result f64)
       f64.const 0.08
       local.set $13
       f64.const 52
      else
       f64.const 0.15
       local.set $13
       f64.const 12
      end
     end
    else
     f64.const 0.02
     local.set $13
     f64.const 1638
    end
    local.tee $23
    f64.sqrt
    local.set $24
    local.get $1
    i32.const 1
    i32.sub
    call $assembly/index/allocateF64Array
    local.set $21
    i32.const 1
    local.set $11
    loop $for-loop|1
     local.get $1
     local.get $11
     i32.gt_s
     if
      local.get $0
      local.get $11
      call $assembly/index/getF64
      local.set $2
      local.get $0
      local.get $11
      i32.const 1
      i32.sub
      call $assembly/index/getF64
      local.tee $22
      f64.const 0
      f64.gt
      local.get $2
      f64.const 0
      f64.gt
      i32.and
      if
       local.get $21
       local.get $12
       local.get $2
       local.get $22
       f64.div
       call $~lib/math/NativeMath.log
       call $assembly/index/setF64
      else
       local.get $21
       local.get $12
       f64.const 0
       call $assembly/index/setF64
      end
      local.get $12
      i32.const 1
      i32.add
      local.set $12
      local.get $11
      i32.const 1
      i32.add
      local.set $11
      br $for-loop|1
     end
    end
    local.get $12
    i32.eqz
    br_if $folding-inner0
    loop $for-loop|2
     local.get $12
     local.get $15
     i32.gt_s
     if
      local.get $10
      local.get $21
      local.get $15
      call $assembly/index/getF64
      f64.add
      local.set $10
      local.get $15
      i32.const 1
      i32.add
      local.set $15
      br $for-loop|2
     end
    end
    local.get $10
    local.get $12
    f64.convert_i32_s
    f64.div
    local.set $2
    loop $for-loop|3
     local.get $12
     local.get $16
     i32.gt_s
     if
      local.get $20
      local.get $21
      local.get $16
      call $assembly/index/getF64
      local.get $2
      f64.sub
      local.tee $10
      local.get $10
      f64.mul
      f64.add
      local.set $20
      local.get $16
      i32.const 1
      i32.add
      local.set $16
      br $for-loop|3
     end
    end
    local.get $2
    local.get $23
    f64.mul
    local.set $20
    loop $for-loop|4
     local.get $12
     local.get $17
     i32.gt_s
     if
      local.get $21
      local.get $17
      call $assembly/index/getF64
      local.tee $2
      f64.const 0
      f64.lt
      if
       local.get $14
       i32.const 1
       i32.add
       local.set $14
       local.get $8
       local.get $2
       local.get $2
       f64.mul
       f64.add
       local.set $8
      end
      local.get $17
      i32.const 1
      i32.add
      local.set $17
      br $for-loop|4
     end
    end
    local.get $20
    local.get $8
    local.get $14
    f64.convert_i32_s
    f64.div
    f64.sqrt
    local.get $24
    f64.mul
    f64.const 0.001
    local.get $14
    i32.const 0
    i32.gt_s
    select
    local.tee $2
    f64.div
    f64.const 3
    local.get $2
    f64.const 0.001
    f64.gt
    select
    local.set $22
    local.get $0
    i32.const 0
    call $assembly/index/getF64
    local.set $2
    loop $for-loop|5
     local.get $1
     local.get $18
     i32.gt_s
     if
      local.get $0
      local.get $18
      call $assembly/index/getF64
      local.tee $8
      local.get $2
      f64.gt
      if
       local.get $8
       local.set $2
      end
      local.get $2
      local.get $8
      f64.sub
      local.get $2
      f64.div
      local.tee $8
      local.get $9
      f64.gt
      if
       local.get $8
       local.set $9
      end
      local.get $18
      i32.const 1
      i32.add
      local.set $18
      br $for-loop|5
     end
    end
    f64.const -999999
    local.set $2
    f64.const 999999
    local.set $8
    loop $for-loop|6
     local.get $12
     local.get $19
     i32.gt_s
     if
      local.get $2
      local.get $21
      local.get $19
      call $assembly/index/getF64
      local.tee $10
      f64.lt
      if
       local.get $10
       local.set $2
      end
      local.get $10
      local.get $8
      local.get $8
      local.get $10
      f64.gt
      select
      local.set $8
      local.get $19
      i32.const 1
      i32.add
      local.set $19
      br $for-loop|6
     end
    end
    local.get $2
    f64.abs
    local.get $8
    f64.abs
    call $assembly/index/max
    call $~lib/math/NativeMath.exp
    f64.const -1
    f64.add
    local.set $2
    local.get $0
    local.get $1
    call $assembly/index/calculateRSquared
    local.set $8
    local.get $3
    local.get $9
    f64.lt
    if
     local.get $7
     i32.const 0
     f64.const -9e3
     call $assembly/index/setF64
     br $folding-inner1
    end
    local.get $4
    local.get $20
    f64.gt
    if
     local.get $7
     i32.const 0
     f64.const -9001
     call $assembly/index/setF64
     br $folding-inner1
    end
    local.get $5
    local.get $13
    local.get $13
    f64.add
    local.get $5
    f64.const 0
    f64.gt
    select
    local.get $2
    f64.lt
    if
     local.get $7
     i32.const 0
     f64.const -9002
     call $assembly/index/setF64
     br $folding-inner1
    end
    local.get $6
    local.get $8
    f64.gt
    if
     local.get $7
     i32.const 0
     f64.const -9003
     call $assembly/index/setF64
     br $folding-inner1
    end
    local.get $22
    f64.const 4
    call $assembly/index/saturate
    local.set $2
    local.get $21
    local.get $12
    call $assembly/index/calculateCVaRPenalty
    local.set $3
    local.get $20
    local.get $9
    f64.div
    f64.const 0
    local.get $9
    f64.const 0.001
    f64.gt
    select
    local.tee $4
    f64.const 4
    call $assembly/index/saturate
    local.get $3
    f64.mul
    local.set $3
    local.get $8
    f64.const 2
    call $assembly/index/pow
    local.set $5
    local.get $0
    local.get $1
    call $assembly/index/calculateChannelScore
    local.set $6
    local.get $7
    i32.const 0
    local.get $2
    f64.const 0.4
    call $assembly/index/pow
    local.get $3
    f64.const 0.3
    call $assembly/index/pow
    f64.mul
    local.get $5
    f64.const 0.2
    call $assembly/index/pow
    f64.mul
    local.get $6
    f64.const 0.1
    call $assembly/index/pow
    f64.mul
    f64.const 100
    f64.mul
    call $assembly/index/setF64
    local.get $7
    i32.const 1
    f64.const 0
    call $assembly/index/setF64
    local.get $7
    i32.const 2
    local.get $2
    call $assembly/index/setF64
    local.get $7
    i32.const 3
    local.get $3
    call $assembly/index/setF64
    local.get $7
    i32.const 4
    local.get $5
    call $assembly/index/setF64
    local.get $7
    i32.const 5
    local.get $6
    call $assembly/index/setF64
    local.get $7
    i32.const 6
    local.get $22
    call $assembly/index/setF64
    local.get $7
    i32.const 7
    local.get $4
    call $assembly/index/setF64
    local.get $7
    i32.const 8
    local.get $8
    call $assembly/index/setF64
    return
   end
   local.get $7
   i32.const 0
   f64.const -9999
   call $assembly/index/setF64
  end
  local.get $7
  i32.const 1
  f64.const 1
  call $assembly/index/setF64
 )
 (func $assembly/index/calculateUltraSmoothV2 (param $0 i32) (param $1 i32) (param $2 f64) (param $3 i32)
  (local $4 f64)
  (local $5 f64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 f64)
  (local $10 f64)
  (local $11 i32)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 f64)
  (local $22 f64)
  (local $23 i32)
  (local $24 f64)
  loop $for-loop|0
   local.get $7
   i32.const 8
   i32.lt_s
   if
    local.get $3
    local.get $7
    f64.const 0
    call $assembly/index/setF64
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|0
   end
  end
  local.get $1
  i32.const 20
  i32.lt_s
  if
   local.get $3
   i32.const 0
   f64.const 0
   call $assembly/index/setF64
   local.get $3
   i32.const 1
   f64.const 1
   call $assembly/index/setF64
   return
  end
  local.get $0
  i32.const 0
  call $assembly/index/getF64
  local.set $9
  local.get $0
  local.get $1
  i32.const 1
  i32.sub
  local.tee $7
  call $assembly/index/getF64
  local.get $9
  f64.sub
  local.get $9
  f64.div
  f64.const 1
  f64.add
  f64.const 252
  local.get $1
  f64.convert_i32_s
  local.tee $12
  f64.div
  call $assembly/index/pow
  f64.const -1
  f64.add
  local.set $14
  local.get $7
  call $assembly/index/allocateF64Array
  local.set $20
  f64.const -999999
  local.set $9
  f64.const 999999
  local.set $10
  i32.const 1
  local.set $7
  loop $for-loop|1
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.get $0
    local.get $7
    i32.const 1
    i32.sub
    local.tee $23
    call $assembly/index/getF64
    local.tee $24
    f64.sub
    local.get $24
    f64.div
    local.set $24
    local.get $20
    local.get $23
    local.get $24
    call $assembly/index/setF64
    local.get $24
    local.get $9
    local.get $9
    local.get $24
    f64.lt
    select
    local.set $9
    local.get $24
    local.get $10
    local.get $10
    local.get $24
    f64.gt
    select
    local.set $10
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|1
   end
  end
  local.get $2
  local.get $9
  f64.lt
  local.get $10
  local.get $2
  f64.neg
  f64.lt
  i32.or
  if
   local.get $3
   i32.const 0
   f64.const 0
   call $assembly/index/setF64
   local.get $3
   i32.const 1
   f64.const 1
   call $assembly/index/setF64
   local.get $3
   i32.const 7
   local.get $14
   call $assembly/index/setF64
   return
  end
  local.get $1
  call $assembly/index/allocateF64Array
  local.set $7
  loop $for-loop|2
   local.get $1
   local.get $6
   i32.gt_s
   if
    local.get $7
    local.get $6
    local.get $0
    local.get $6
    call $assembly/index/getF64
    local.tee $2
    f64.const 0
    f64.gt
    if (result f64)
     local.get $2
     call $~lib/math/NativeMath.log
    else
     f64.const 0
    end
    call $assembly/index/setF64
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|2
   end
  end
  local.get $7
  local.get $1
  i32.const 1
  call $assembly/index/allocateF64Array
  local.tee $6
  i32.const 1
  call $assembly/index/allocateF64Array
  local.tee $7
  call $assembly/index/linearRegression
  local.get $6
  i32.const 0
  call $assembly/index/getF64
  local.set $2
  local.get $7
  i32.const 0
  call $assembly/index/getF64
  local.set $9
  local.get $1
  call $assembly/index/allocateF64Array
  local.set $7
  local.get $1
  call $assembly/index/allocateF64Array
  local.set $6
  loop $for-loop|3
   local.get $1
   local.get $8
   i32.gt_s
   if
    local.get $9
    local.get $2
    local.get $8
    f64.convert_i32_s
    f64.mul
    f64.add
    call $~lib/math/NativeMath.exp
    local.set $10
    local.get $0
    local.get $8
    call $assembly/index/getF64
    local.set $24
    block $for-continue|3
     local.get $10
     f64.const 0.0001
     f64.le
     if
      local.get $7
      local.get $8
      f64.const 1
      call $assembly/index/setF64
      local.get $6
      local.get $8
      f64.const 0
      call $assembly/index/setF64
      br $for-continue|3
     end
     local.get $7
     local.get $8
     local.get $24
     local.get $10
     f64.sub
     local.get $10
     f64.div
     local.tee $10
     f64.abs
     call $assembly/index/setF64
     local.get $6
     local.get $8
     local.get $10
     call $assembly/index/setF64
    end
    local.get $8
    i32.const 1
    i32.add
    local.set $8
    br $for-loop|3
   end
  end
  loop $for-loop|4
   local.get $1
   local.get $11
   i32.gt_s
   if
    local.get $13
    local.get $6
    local.get $11
    call $assembly/index/getF64
    f64.add
    local.set $13
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    br $for-loop|4
   end
  end
  local.get $13
  local.get $12
  f64.div
  local.set $2
  loop $for-loop|5
   local.get $1
   local.get $15
   i32.gt_s
   if
    local.get $21
    local.get $6
    local.get $15
    call $assembly/index/getF64
    local.get $2
    f64.sub
    local.tee $9
    local.get $9
    f64.mul
    f64.add
    local.set $21
    local.get $15
    i32.const 1
    i32.add
    local.set $15
    br $for-loop|5
   end
  end
  local.get $6
  local.get $1
  i32.const 1
  i32.sub
  call $assembly/index/getF64
  local.get $2
  f64.sub
  local.get $21
  local.get $12
  f64.div
  f64.sqrt
  local.tee $2
  f64.div
  f64.const 0
  local.get $2
  f64.const 1e-06
  f64.gt
  select
  local.set $9
  loop $for-loop|6
   local.get $1
   local.get $16
   i32.gt_s
   if
    local.get $7
    local.get $16
    call $assembly/index/getF64
    local.tee $2
    local.get $4
    f64.gt
    if
     local.get $2
     local.set $4
    end
    local.get $16
    i32.const 1
    i32.add
    local.set $16
    br $for-loop|6
   end
  end
  loop $for-loop|7
   local.get $1
   local.get $17
   i32.gt_s
   if
    local.get $22
    local.get $7
    local.get $17
    call $assembly/index/getF64
    local.tee $2
    local.get $2
    f64.mul
    f64.add
    local.set $22
    local.get $17
    i32.const 1
    i32.add
    local.set $17
    br $for-loop|7
   end
  end
  local.get $22
  local.get $12
  f64.div
  f64.sqrt
  local.set $10
  local.get $1
  i32.const 5
  i32.div_s
  local.tee $0
  i32.const 20
  i32.ge_s
  if
   i32.const 20
   local.set $0
  end
  local.get $0
  call $assembly/index/allocateF64Array
  local.set $11
  local.get $0
  local.set $6
  loop $for-loop|8
   local.get $6
   local.get $1
   i32.const 1
   i32.sub
   i32.lt_s
   if
    i32.const 0
    local.set $8
    loop $for-loop|9
     local.get $0
     local.get $8
     i32.gt_s
     if
      local.get $11
      local.get $8
      local.get $20
      local.get $6
      local.get $0
      i32.sub
      local.get $8
      i32.add
      call $assembly/index/getF64
      call $assembly/index/setF64
      local.get $8
      i32.const 1
      i32.add
      local.set $8
      br $for-loop|9
     end
    end
    local.get $11
    local.get $0
    call $assembly/index/calculateStandardDeviation
    local.tee $2
    local.get $5
    f64.gt
    if
     local.get $2
     local.set $5
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|8
   end
  end
  loop $for-loop|10
   local.get $1
   local.get $18
   i32.gt_s
   if
    local.get $19
    i32.const 1
    i32.add
    local.get $19
    local.get $7
    local.get $18
    call $assembly/index/getF64
    f64.const 0.03
    f64.le
    select
    local.set $19
    local.get $18
    i32.const 1
    i32.add
    local.set $18
    br $for-loop|10
   end
  end
  local.get $19
  f64.convert_i32_s
  local.get $12
  f64.div
  local.set $2
  local.get $3
  i32.const 0
  f64.const 0
  local.get $14
  local.get $10
  f64.div
  f64.const 0
  local.get $10
  f64.const 0
  f64.gt
  select
  local.get $4
  f64.const 0.05
  f64.gt
  if (result f64)
   f64.const 0
   f64.const 1
   local.get $4
   f64.const -0.05
   f64.add
   f64.const 5
   f64.mul
   f64.sub
   call $assembly/index/max
  else
   f64.const 1
  end
  f64.const 0.6
  f64.mul
  local.get $5
  f64.const 0.02
  f64.gt
  if (result f64)
   f64.const 0
   f64.const 1
   local.get $5
   f64.const -0.02
   f64.add
   f64.const 10
   f64.mul
   f64.sub
   call $assembly/index/max
  else
   f64.const 1
  end
  f64.const 0.4
  f64.mul
  f64.add
  f64.mul
  local.get $2
  f64.const 0.5
  f64.mul
  f64.const 0.5
  f64.add
  f64.mul
  call $assembly/index/max
  call $assembly/index/setF64
  local.get $3
  i32.const 1
  f64.const 0
  call $assembly/index/setF64
  local.get $3
  i32.const 2
  local.get $10
  call $assembly/index/setF64
  local.get $3
  i32.const 3
  local.get $4
  call $assembly/index/setF64
  local.get $3
  i32.const 4
  local.get $5
  call $assembly/index/setF64
  local.get $3
  i32.const 5
  local.get $2
  call $assembly/index/setF64
  local.get $3
  i32.const 6
  local.get $9
  call $assembly/index/setF64
  local.get $3
  i32.const 7
  local.get $14
  call $assembly/index/setF64
 )
 (func $assembly/index/calculateSuperAI_v1 (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 i32)
  (local $7 i32)
  (local $8 f64)
  (local $9 f64)
  loop $for-loop|0
   local.get $6
   i32.const 4
   i32.lt_s
   if
    local.get $2
    local.get $6
    f64.const 0
    call $assembly/index/setF64
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|0
   end
  end
  local.get $1
  i32.const 2
  i32.lt_s
  if
   return
  end
  i32.const 1
  local.set $6
  loop $for-loop|1
   local.get $1
   local.get $6
   i32.gt_s
   if
    local.get $0
    local.get $6
    call $assembly/index/getF64
    local.set $8
    local.get $0
    local.get $6
    i32.const 1
    i32.sub
    call $assembly/index/getF64
    local.tee $9
    f64.const 0
    f64.gt
    if
     local.get $3
     local.get $8
     local.get $9
     f64.sub
     local.get $9
     f64.div
     f64.add
     local.set $3
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|1
   end
  end
  local.get $3
  local.get $1
  i32.const 1
  i32.sub
  f64.convert_i32_s
  f64.div
  local.set $3
  i32.const 1
  local.set $6
  loop $for-loop|2
   local.get $1
   local.get $6
   i32.gt_s
   if
    local.get $0
    local.get $6
    call $assembly/index/getF64
    local.set $8
    local.get $0
    local.get $6
    i32.const 1
    i32.sub
    call $assembly/index/getF64
    local.tee $9
    f64.const 0
    f64.gt
    if
     local.get $4
     local.get $8
     local.get $9
     f64.sub
     local.get $9
     f64.div
     local.get $3
     f64.sub
     local.tee $4
     local.get $4
     f64.mul
     f64.add
     local.set $4
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|2
   end
  end
  local.get $4
  local.get $1
  i32.const 1
  i32.sub
  local.tee $6
  f64.convert_i32_s
  f64.div
  f64.sqrt
  f64.const 15.874507866387544
  f64.mul
  local.set $8
  local.get $0
  i32.const 0
  call $assembly/index/getF64
  local.set $3
  local.get $0
  local.get $6
  call $assembly/index/getF64
  local.get $3
  f64.sub
  local.get $3
  f64.div
  f64.const 1
  f64.add
  f64.const 1
  local.get $1
  f64.convert_i32_s
  f64.const 252
  f64.div
  f64.div
  call $assembly/index/pow
  f64.const -1
  f64.add
  local.set $9
  loop $for-loop|3
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.tee $4
    local.get $3
    f64.gt
    if
     local.get $4
     local.set $3
    end
    local.get $3
    local.get $4
    f64.sub
    local.get $3
    f64.div
    local.tee $4
    local.get $5
    f64.gt
    if
     local.get $4
     local.set $5
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|3
   end
  end
  local.get $2
  i32.const 0
  local.get $9
  local.get $8
  f64.div
  f64.const 0
  local.get $8
  f64.const 0.001
  f64.gt
  select
  local.tee $3
  f64.const 0.6
  f64.mul
  local.get $9
  local.get $5
  f64.div
  f64.const 0
  local.get $5
  f64.const 0.001
  f64.gt
  select
  local.tee $4
  f64.const 0.2
  f64.mul
  f64.add
  local.get $0
  local.get $1
  call $assembly/index/calculateRSquared
  local.tee $5
  f64.const 0.2
  f64.mul
  f64.add
  call $assembly/index/setF64
  local.get $2
  i32.const 1
  local.get $3
  call $assembly/index/setF64
  local.get $2
  i32.const 2
  local.get $4
  call $assembly/index/setF64
  local.get $2
  i32.const 3
  local.get $5
  call $assembly/index/setF64
 )
 (func $assembly/index/calculateUltraSmoothV1 (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 f64)
  loop $for-loop|0
   local.get $6
   i32.const 4
   i32.lt_s
   if
    local.get $2
    local.get $6
    f64.const 0
    call $assembly/index/setF64
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|0
   end
  end
  local.get $1
  i32.const 2
  i32.lt_s
  if
   return
  end
  local.get $0
  local.get $1
  call $assembly/index/calculateRSquared
  local.set $9
  local.get $0
  i32.const 0
  call $assembly/index/getF64
  local.set $5
  loop $for-loop|1
   local.get $1
   local.get $7
   i32.gt_s
   if
    local.get $0
    local.get $7
    call $assembly/index/getF64
    local.tee $4
    local.get $5
    f64.gt
    if
     local.get $4
     local.set $5
    end
    local.get $5
    local.get $4
    f64.sub
    local.get $5
    f64.div
    local.tee $4
    local.get $3
    f64.gt
    if
     local.get $4
     local.set $3
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|1
   end
  end
  i32.const 1
  local.set $6
  loop $for-loop|2
   local.get $1
   local.get $6
   i32.gt_s
   if
    local.get $8
    i32.const 1
    i32.add
    local.get $8
    local.get $0
    local.get $6
    call $assembly/index/getF64
    local.get $0
    local.get $6
    i32.const 1
    i32.sub
    call $assembly/index/getF64
    f64.gt
    select
    local.set $8
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|2
   end
  end
  local.get $2
  i32.const 0
  local.get $9
  f64.const 2
  call $assembly/index/pow
  f64.const 1
  local.get $3
  f64.sub
  f64.const 2
  call $assembly/index/pow
  f64.mul
  local.get $8
  f64.convert_i32_s
  local.get $1
  i32.const 1
  i32.sub
  f64.convert_i32_s
  f64.div
  local.tee $4
  f64.mul
  call $assembly/index/setF64
  local.get $2
  i32.const 1
  local.get $9
  call $assembly/index/setF64
  local.get $2
  i32.const 2
  local.get $3
  call $assembly/index/setF64
  local.get $2
  i32.const 3
  local.get $4
  call $assembly/index/setF64
 )
 (func $assembly/index/calculateUltraSmoothV3 (param $0 i32) (param $1 i32) (param $2 f64) (param $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  loop $for-loop|0
   local.get $4
   i32.const 4
   i32.lt_s
   if
    local.get $3
    local.get $4
    f64.const 0
    call $assembly/index/setF64
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|0
   end
  end
  local.get $0
  local.get $1
  local.get $2
  i32.const 8
  call $assembly/index/allocateF64Array
  local.tee $0
  call $assembly/index/calculateUltraSmoothV2
  local.get $0
  i32.const 0
  call $assembly/index/getF64
  local.set $6
  local.get $0
  i32.const 1
  call $assembly/index/getF64
  local.set $5
  local.get $0
  i32.const 5
  call $assembly/index/getF64
  local.set $2
  local.get $0
  i32.const 6
  call $assembly/index/getF64
  local.set $7
  local.get $5
  f64.const 0
  f64.ne
  if
   local.get $3
   i32.const 0
   f64.const -9999
   call $assembly/index/setF64
   local.get $3
   i32.const 1
   local.get $6
   call $assembly/index/setF64
   local.get $3
   i32.const 2
   local.get $7
   call $assembly/index/setF64
   local.get $3
   i32.const 3
   local.get $2
   call $assembly/index/setF64
   return
  end
  local.get $3
  i32.const 0
  local.get $6
  f64.const 0.1
  f64.mul
  local.get $6
  local.get $7
  f64.abs
  f64.const 1
  f64.add
  f64.mul
  local.get $7
  f64.const 0.1
  f64.gt
  select
  call $assembly/index/setF64
  local.get $3
  i32.const 1
  local.get $6
  call $assembly/index/setF64
  local.get $3
  i32.const 2
  local.get $7
  call $assembly/index/setF64
  local.get $3
  i32.const 3
  local.get $2
  call $assembly/index/setF64
 )
)
