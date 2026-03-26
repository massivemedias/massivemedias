import{go as J,d1 as j,gp as Z,j as t,gq as te,r as d,gr as ke,gs as N,gt as F,gu as B,gv as Le,gw as Ve,ae as ze,gx as Ue,gy as Be,gz as He,gA as Ke,gB as We,gC as Ze,gD as oe,a as A,Z as D,I as S,U as ne,db as Ye,o as pe,dA as fe,gE as v,h as x,d8 as qe,d9 as Je,T,dR as me,ez as Y,bH as he,eB as Qe,eD as Xe,ey as et,eA as tt,eC as xe,fY as ot,gF as nt,gG as rt,gH as st,L as K,ga as at,gb as it,dF as lt,gI as ct,af as dt,fA as ut,gJ as gt,n as re,P as se,R as pt,J as ft}from"./strapi-WIx0ocis.js";function mt(e){const o=e+"CollectionProvider",[n,s]=J(o),[r,c]=n(o,{collectionRef:{current:null},itemMap:new Map}),i=m=>{const{scope:g,children:C}=m,R=j.useRef(null),h=j.useRef(new Map).current;return t.jsx(r,{scope:g,itemMap:h,collectionRef:R,children:C})};i.displayName=o;const l=e+"CollectionSlot",p=te(l),f=j.forwardRef((m,g)=>{const{scope:C,children:R}=m,h=c(l,C),I=Z(g,h.collectionRef);return t.jsx(p,{ref:I,children:R})});f.displayName=l;const a=e+"CollectionItemSlot",u="data-radix-collection-item",b=te(a),y=j.forwardRef((m,g)=>{const{scope:C,children:R,...h}=m,I=j.useRef(null),G=Z(g,I),_=c(a,C);return j.useEffect(()=>(_.itemMap.set(I,{ref:I,...h}),()=>void _.itemMap.delete(I))),t.jsx(b,{[u]:"",ref:G,children:R})});y.displayName=a;function M(m){const g=c(e+"CollectionConsumer",m);return j.useCallback(()=>{const R=g.collectionRef.current;if(!R)return[];const h=Array.from(R.querySelectorAll(`[${u}]`));return Array.from(g.itemMap.values()).sort((_,L)=>h.indexOf(_.ref.current)-h.indexOf(L.ref.current))},[g.collectionRef,g.itemMap])}return[{Provider:i,Slot:f,ItemSlot:y},M,s]}var ht=d.createContext(void 0);function ve(e){const o=d.useContext(ht);return e||o||"ltr"}var W="rovingFocusGroup.onEntryFocus",xt={bubbles:!1,cancelable:!0},k="RovingFocusGroup",[q,be,vt]=mt(k),[bt,je]=J(k,[vt]),[jt,It]=bt(k),Ie=d.forwardRef((e,o)=>t.jsx(q.Provider,{scope:e.__scopeRovingFocusGroup,children:t.jsx(q.Slot,{scope:e.__scopeRovingFocusGroup,children:t.jsx(Ct,{...e,ref:o})})}));Ie.displayName=k;var Ct=d.forwardRef((e,o)=>{const{__scopeRovingFocusGroup:n,orientation:s,loop:r=!1,dir:c,currentTabStopId:i,defaultCurrentTabStopId:l,onCurrentTabStopIdChange:p,onEntryFocus:f,preventScrollOnEntryFocus:a=!1,...u}=e,b=d.useRef(null),y=Z(o,b),M=ve(c),[m,g]=B({prop:i,defaultProp:l??null,onChange:p,caller:k}),[C,R]=d.useState(!1),h=Le(f),I=be(n),G=d.useRef(!1),[_,L]=d.useState(0);return d.useEffect(()=>{const w=b.current;if(w)return w.addEventListener(W,h),()=>w.removeEventListener(W,h)},[h]),t.jsx(jt,{scope:n,orientation:s,dir:M,loop:r,currentTabStopId:m,onItemFocus:d.useCallback(w=>g(w),[g]),onItemShiftTab:d.useCallback(()=>R(!0),[]),onFocusableItemAdd:d.useCallback(()=>L(w=>w+1),[]),onFocusableItemRemove:d.useCallback(()=>L(w=>w-1),[]),children:t.jsx(N.div,{tabIndex:C||_===0?-1:0,"data-orientation":s,...u,ref:y,style:{outline:"none",...e.style},onMouseDown:F(e.onMouseDown,()=>{G.current=!0}),onFocus:F(e.onFocus,w=>{const _e=!G.current;if(w.target===w.currentTarget&&_e&&!C){const ee=new CustomEvent(W,xt);if(w.currentTarget.dispatchEvent(ee),!ee.defaultPrevented){const H=I().filter(P=>P.focusable),$e=H.find(P=>P.active),Oe=H.find(P=>P.id===m),Ne=[$e,Oe,...H].filter(Boolean).map(P=>P.ref.current);we(Ne,a)}}G.current=!1}),onBlur:F(e.onBlur,()=>R(!1))})})}),Ce="RovingFocusGroupItem",ye=d.forwardRef((e,o)=>{const{__scopeRovingFocusGroup:n,focusable:s=!0,active:r=!1,tabStopId:c,children:i,...l}=e,p=ke(),f=c||p,a=It(Ce,n),u=a.currentTabStopId===f,b=be(n),{onFocusableItemAdd:y,onFocusableItemRemove:M,currentTabStopId:m}=a;return d.useEffect(()=>{if(s)return y(),()=>M()},[s,y,M]),t.jsx(q.ItemSlot,{scope:n,id:f,focusable:s,active:r,children:t.jsx(N.span,{tabIndex:u?0:-1,"data-orientation":a.orientation,...l,ref:o,onMouseDown:F(e.onMouseDown,g=>{s?a.onItemFocus(f):g.preventDefault()}),onFocus:F(e.onFocus,()=>a.onItemFocus(f)),onKeyDown:F(e.onKeyDown,g=>{if(g.key==="Tab"&&g.shiftKey){a.onItemShiftTab();return}if(g.target!==g.currentTarget)return;const C=Tt(g,a.orientation,a.dir);if(C!==void 0){if(g.metaKey||g.ctrlKey||g.altKey||g.shiftKey)return;g.preventDefault();let h=b().filter(I=>I.focusable).map(I=>I.ref.current);if(C==="last")h.reverse();else if(C==="prev"||C==="next"){C==="prev"&&h.reverse();const I=h.indexOf(g.currentTarget);h=a.loop?Rt(h,I+1):h.slice(I+1)}setTimeout(()=>we(h))}}),children:typeof i=="function"?i({isCurrentTabStop:u,hasTabStop:m!=null}):i})})});ye.displayName=Ce;var yt={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function wt(e,o){return o!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function Tt(e,o,n){const s=wt(e.key,n);if(!(o==="vertical"&&["ArrowLeft","ArrowRight"].includes(s))&&!(o==="horizontal"&&["ArrowUp","ArrowDown"].includes(s)))return yt[s]}function we(e,o=!1){const n=document.activeElement;for(const s of e)if(s===n||(s.focus({preventScroll:o}),document.activeElement!==n))return}function Rt(e,o){return e.map((n,s)=>e[(o+s)%e.length])}var St=Ie,Mt=ye,Te="Toggle",Re=d.forwardRef((e,o)=>{const{pressed:n,defaultPressed:s,onPressedChange:r,...c}=e,[i,l]=B({prop:n,onChange:r,defaultProp:s??!1,caller:Te});return t.jsx(N.button,{type:"button","aria-pressed":i,"data-state":i?"on":"off","data-disabled":e.disabled?"":void 0,...c,ref:o,onClick:F(e.onClick,()=>{e.disabled||l(!i)})})});Re.displayName=Te;var E="ToggleGroup",[Se]=J(E,[je]),Me=je(),Q=j.forwardRef((e,o)=>{const{type:n,...s}=e;if(n==="single"){const r=s;return t.jsx(Dt,{...r,ref:o})}if(n==="multiple"){const r=s;return t.jsx(At,{...r,ref:o})}throw new Error(`Missing prop \`type\` expected on \`${E}\``)});Q.displayName=E;var[De,Ae]=Se(E),Dt=j.forwardRef((e,o)=>{const{value:n,defaultValue:s,onValueChange:r=()=>{},...c}=e,[i,l]=B({prop:n,defaultProp:s??"",onChange:r,caller:E});return t.jsx(De,{scope:e.__scopeToggleGroup,type:"single",value:j.useMemo(()=>i?[i]:[],[i]),onItemActivate:l,onItemDeactivate:j.useCallback(()=>l(""),[l]),children:t.jsx(Ee,{...c,ref:o})})}),At=j.forwardRef((e,o)=>{const{value:n,defaultValue:s,onValueChange:r=()=>{},...c}=e,[i,l]=B({prop:n,defaultProp:s??[],onChange:r,caller:E}),p=j.useCallback(a=>l((u=[])=>[...u,a]),[l]),f=j.useCallback(a=>l((u=[])=>u.filter(b=>b!==a)),[l]);return t.jsx(De,{scope:e.__scopeToggleGroup,type:"multiple",value:i,onItemActivate:p,onItemDeactivate:f,children:t.jsx(Ee,{...c,ref:o})})});Q.displayName=E;var[Et,Pt]=Se(E),Ee=j.forwardRef((e,o)=>{const{__scopeToggleGroup:n,disabled:s=!1,rovingFocus:r=!0,orientation:c,dir:i,loop:l=!0,...p}=e,f=Me(n),a=ve(i),u={role:"group",dir:a,...p};return t.jsx(Et,{scope:n,rovingFocus:r,disabled:s,children:r?t.jsx(St,{asChild:!0,...f,orientation:c,dir:a,loop:l,children:t.jsx(N.div,{...u,ref:o})}):t.jsx(N.div,{...u,ref:o})})}),U="ToggleGroupItem",Pe=j.forwardRef((e,o)=>{const n=Ae(U,e.__scopeToggleGroup),s=Pt(U,e.__scopeToggleGroup),r=Me(e.__scopeToggleGroup),c=n.value.includes(e.value),i=s.disabled||e.disabled,l={...e,pressed:c,disabled:i},p=j.useRef(null);return s.rovingFocus?t.jsx(Mt,{asChild:!0,...r,focusable:!i,active:c,ref:p,children:t.jsx(ae,{...l,ref:o})}):t.jsx(ae,{...l,ref:o})});Pe.displayName=U;var ae=j.forwardRef((e,o)=>{const{__scopeToggleGroup:n,value:s,...r}=e,c=Ae(U,n),i={role:"radio","aria-checked":e.pressed,"aria-pressed":void 0},l=c.type==="single"?i:void 0;return t.jsx(Re,{...l,...r,ref:o,onPressedChange:p=>{p?c.onItemActivate(s):c.onItemDeactivate(s)}})}),Ft=Q,Gt=Pe,z=function(e){return e.Video="video",e.Image="image",e.Document="doc",e.Audio="audio",e}({});function ie(e,o=0){const n=typeof e=="string"?Number(e):e,{value:s,unit:r}=Ve(n*1e3,{precision:o});return r?`${s}${r.toUpperCase()}`:"0B"}const _t=e=>e&&e[0]==="."?e.substring(1):e,le=e=>e&&e.startsWith("/")?`${window.strapi.backendURL}${e}`:e,$t={pdf:Ze,csv:We,xls:Ke,zip:He},X=(e,o)=>{const n=_t(o);return e?.includes(z.Image)?ze:e?.includes(z.Video)?Ue:e?.includes(z.Audio)?Be:n?$t[n]||oe:oe},Ot=x(qe)`
  border: 1px solid ${({theme:e})=>e.colors.neutral200};
  border-radius: 8px;
  overflow: hidden;
`,ce=x(D)`
  position: relative;
  width: 100%;
  padding-bottom: 62.5%;
  height: 0;
  overflow: hidden;
  background: repeating-conic-gradient(
      ${({theme:e})=>e.colors.neutral100} 0% 25%,
      transparent 0% 50%
    )
    50% / 20px 20px;
`,Nt=x.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`,kt=x(T)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: ${({theme:e})=>e.colors.neutral500};
  background: ${({theme:e})=>e.colors.neutral100};
`,Lt=({asset:e})=>{const{alternativeText:o,ext:n,formats:s,mime:r,url:c}=e;if(r?.includes(z.Image)){const l=le(s?.thumbnail?.url)??le(c);if(l)return t.jsx(ce,{children:t.jsx(Nt,{src:l,alt:o||""})})}const i=X(r,n);return t.jsx(ce,{children:t.jsx(kt,{justifyContent:"center",alignItems:"center",children:t.jsx(i,{width:48,height:48})})})},Vt=x(Je)`
  border-bottom: none;
`,zt=x(T)`
  min-width: 0;
`,Ut=x(T)`
  color: ${({theme:e})=>e.colors.neutral600};
  flex-shrink: 0;
`,Bt=x(S)`
  flex: 1;
  min-width: 0;
`,Ht=({asset:e})=>{const{formatMessage:o}=A(),n=X(e.mime,e.ext);return t.jsxs(Ot,{children:[t.jsx(Vt,{children:t.jsx(Lt,{asset:e})}),t.jsx(Ye,{children:t.jsxs(zt,{alignItems:"center",gap:2,paddingTop:2,children:[t.jsx(Ut,{children:t.jsx(n,{width:16,height:16})}),t.jsx(Bt,{textColor:"primary800",ellipsis:!0,children:e.name}),t.jsx(pe,{label:o({id:v("control-card.more-actions"),defaultMessage:"More actions"}),variant:"ghost",children:t.jsx(fe,{})})]})})]})},Kt=({assets:e})=>{const{formatMessage:o}=A();return e.length===0?t.jsx(D,{padding:8,children:t.jsx(S,{textColor:"neutral600",children:o({id:"app.components.EmptyStateLayout.content-document",defaultMessage:"No content found"})})}):t.jsx(ne.Root,{gap:4,children:e.map(n=>t.jsx(ne.Item,{col:3,m:4,s:6,xs:12,direction:"column",alignItems:"stretch",children:t.jsx(Ht,{asset:n})},n.id))})},Wt={view:"STRAPI_UPLOAD_LIBRARY_VIEW"},O={GRID:0,TABLE:1},de=[{name:"name",label:{id:v("list.table.header.name"),defaultMessage:"name"}},{name:"createdAt",label:{id:v("list.table.header.creationDate"),defaultMessage:"creation date"}},{name:"updatedAt",label:{id:v("list.table.header.lastModified"),defaultMessage:"last modified"}},{name:"size",label:{id:v("list.table.header.size"),defaultMessage:"size"}},{name:"actions",label:{id:v("list.table.header.actions"),defaultMessage:"actions"},isVisuallyHidden:!0}],Zt=x(Xe)`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
  border-radius: 4px;
  overflow: hidden;
`,Yt=x(et)`
  background: ${({theme:e})=>e.colors.neutral100};

  tr {
    border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};
  }
`,ue=x(tt)`
  height: 40px;
  padding: 0 ${({theme:e})=>e.spaces[4]};
  text-align: left;
`,$=x(xe)`
  padding: 0 ${({theme:e})=>e.spaces[4]};
  border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};
`,qt=x(Y)`
  height: 48px;
  background: ${({theme:e})=>e.colors.neutral0};

  &:last-child {
    ${$} {
      border-bottom: 0;
    }
  }
`,Jt=x(xe)`
  padding: ${({theme:e})=>e.spaces[4]};
  border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};
`,Qt=({asset:e})=>{const{ext:o,mime:n}=e,s=X(n,o);return t.jsx(T,{justifyContent:"center",alignItems:"center",borderRadius:"4px",color:"neutral500",width:"3.2rem",height:"3.2rem",shrink:0,children:t.jsx(s,{width:16,height:16})})},Xt=({asset:e})=>{const o=me(),{formatDate:n,formatMessage:s}=A();return t.jsxs(qt,{children:[t.jsx($,{children:t.jsxs(T,{gap:3,alignItems:"center",children:[t.jsx(Qt,{asset:e}),t.jsxs(T,{direction:"column",alignItems:"flex-start",children:[t.jsx(S,{textColor:"neutral800",fontWeight:"semiBold",ellipsis:!0,children:e.name}),o&&t.jsx(S,{textColor:"neutral600",variant:"pi",children:e.size?ie(e.size,1):"-"})]})]})}),!o&&t.jsxs(t.Fragment,{children:[t.jsx($,{children:t.jsx(S,{textColor:"neutral600",children:e.createdAt?n(new Date(e.createdAt),{dateStyle:"long"}):"-"})}),t.jsx($,{children:t.jsx(S,{textColor:"neutral600",children:e.updatedAt?n(new Date(e.updatedAt),{dateStyle:"long"}):"-"})}),t.jsx($,{children:t.jsx(S,{textColor:"neutral600",children:e.size?ie(e.size,1):"-"})})]}),t.jsx($,{children:t.jsx(T,{justifyContent:"flex-end",children:t.jsx(pe,{label:s({id:v("control-card.more-actions"),defaultMessage:"More actions"}),variant:"ghost",children:t.jsx(fe,{})})})})]})},eo=({assets:e})=>{const o=me(),{formatMessage:n}=A(),s=o?de.filter(r=>r.name==="name"||r.name==="actions"):de;return t.jsxs(Zt,{colCount:s.length,rowCount:e.length+1,children:[t.jsx(Yt,{children:t.jsx(Y,{children:s.map(r=>{const c=n(r.label);return"isVisuallyHidden"in r&&r.isVisuallyHidden?t.jsx(ue,{children:t.jsx(he,{children:n({id:v("table.header.actions"),defaultMessage:"actions"})})},r.name):t.jsx(ue,{children:t.jsx(S,{textColor:"neutral600",variant:"sigma",children:c})},r.name)})})}),t.jsx(Qe,{children:e.length===0?t.jsx(Y,{children:t.jsx(Jt,{colSpan:s.length,children:t.jsx(S,{textColor:"neutral600",children:n({id:"app.components.EmptyStateLayout.content-document",defaultMessage:"No content found"})})})}):e.map(r=>t.jsx(Xt,{asset:r},r.id))})]})},Fe=d.createContext(null),to=x(D)`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
`,oo=({children:e,onDrop:o})=>{const[n,s]=d.useState(!1),r=d.useRef(0),c={isDragging:n};d.useEffect(()=>{const a=()=>{s(!1),r.current=0},u=b=>{b.relatedTarget||(s(!1),r.current=0)};return document.addEventListener("dragend",a),document.addEventListener("dragleave",u),()=>{document.removeEventListener("dragend",a),document.removeEventListener("dragleave",u)}},[]);const i=d.useCallback(a=>{a.preventDefault(),a.stopPropagation(),r.current+=1,a.dataTransfer.types.includes("Files")&&s(!0)},[]),l=d.useCallback(a=>{a.preventDefault(),a.stopPropagation(),r.current-=1,r.current<=0&&(s(!1),r.current=0)},[]),p=d.useCallback(a=>{a.preventDefault(),a.stopPropagation(),a.dataTransfer.dropEffect="copy"},[]),f=d.useCallback(a=>{a.preventDefault(),a.stopPropagation(),s(!1),r.current=0;const{files:u}=a.dataTransfer;u?.length&&o&&o(Array.from(u))},[o]);return t.jsx(Fe.Provider,{value:c,children:t.jsx(to,{"data-testid":"assets-dropzone",onDragEnter:i,onDragLeave:l,onDragOver:p,onDrop:f,children:e})})},Ge=()=>{const e=d.useContext(Fe);if(!e)throw new Error("useUploadDropZone must be used within UploadDropZone");return{isDragging:e.isDragging}},no=(e,o)=>`${e}${Math.floor(o*255).toString(16).padStart(2,"0")}`,ro=x(D)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({theme:e})=>no(e.colors.primary200,.3)};
  border: 1px solid ${({theme:e})=>e.colors.primary700};
  border-radius: ${({theme:e})=>e.borderRadius};
  z-index: 1;
  pointer-events: none;
`,so=({children:e})=>{const{isDragging:o}=Ge();return t.jsxs(D,{position:"relative",children:[o&&t.jsx(ro,{}),e]})},ao=x(D)`
  position: fixed;
  bottom: ${({theme:e})=>e.spaces[8]};
  left: 50%;
  transform: translateX(calc(-50% + ${({$leftContentWidth:e})=>e/2}px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({theme:e})=>e.spaces[2]};
  background: ${({theme:e})=>e.colors.primary600};
  padding: ${({theme:e})=>e.spaces[4]} ${({theme:e})=>e.spaces[6]};
  border-radius: ${({theme:e})=>e.borderRadius};
  z-index: 2;
`,io=({uploadDropZoneRef:e})=>{const{formatMessage:o}=A(),{isDragging:n}=Ge(),[s,r]=d.useState(0);return d.useEffect(()=>{if(!e?.current)return;const c=()=>{const l=e.current?.getBoundingClientRect();l&&r(p=>p!==l.left?l.left:p)};c();const i=new ResizeObserver(c);return i.observe(e.current),()=>i.disconnect()},[e]),n?t.jsxs(ao,{$leftContentWidth:s,children:[t.jsx(S,{textColor:"neutral0",children:o({id:v("dropzone.upload.message"),defaultMessage:"Drop here to upload to"})}),t.jsxs(T,{gap:2,alignItems:"center",children:[t.jsx(ot,{width:20,height:20,fill:"neutral0"}),t.jsx(S,{textColor:"neutral0",fontWeight:"semiBold",children:"Current folder"})]})]}):null},lo=nt.injectEndpoints({endpoints:e=>({getAssets:e.query({query:(o={})=>({url:"/upload/files",method:"GET",config:{params:o}}),transformResponse:o=>o,providesTags:o=>o?[...o.results.map(({id:n})=>({type:"Asset",id:n})),{type:"Asset",id:"LIST"}]:[{type:"Asset",id:"LIST"}]})})}),{useGetAssetsQuery:co}=lo,V=20,uo=({folder:e=null,sort:o}={})=>{const[n,s]=d.useState(1),r=d.useRef([]),c=d.useRef(!0),{currentData:i,isLoading:l,isFetching:p,error:f}=co({folder:e,page:n,pageSize:V,sort:o}),a=i?.pagination,u=d.useMemo(()=>{if(!i)return r.current;const m=i.results;if(n===1)r.current=m;else{const g=(n-1)*V;if(r.current.length<g-V)return r.current;r.current.length<n*V&&(r.current=[...r.current,...m])}return r.current},[i,n]);d.useEffect(()=>{if(c.current){c.current=!1;return}s(1),r.current=[]},[e,o]);const b=a?n<a.pageCount:!1,y=p&&n>1,M=d.useCallback(()=>{s(m=>m+1)},[]);return{assets:u,pagination:a,isLoading:l,isFetchingMore:y,hasNextPage:b,fetchNextPage:M,error:f}},go={threshold:.1},po=({view:e})=>{const{formatMessage:o}=A(),{assets:n,isLoading:s,isFetchingMore:r,hasNextPage:c,fetchNextPage:i,error:l}=uo(),p=e===O.GRID,f=gt(d.useCallback(a=>{a&&c&&!r&&i()},[c,r,i]),go);return s?t.jsx(T,{justifyContent:"center",padding:8,children:t.jsx(re,{children:o({id:"app.loading",defaultMessage:"Loading..."})})}):l?t.jsx(D,{padding:8,children:t.jsx(S,{textColor:"danger600",children:o({id:v("list.assets.error"),defaultMessage:"An error occurred while fetching assets."})})}):t.jsxs(t.Fragment,{children:[p?t.jsx(Kt,{assets:n}):t.jsx(eo,{assets:n}),t.jsx("div",{ref:f,style:{height:1}}),r&&t.jsx(T,{justifyContent:"center",padding:4,children:t.jsx(re,{children:o({id:v("list.assets.loading-more"),defaultMessage:"Loading more assets..."})})})]})},fo=x(Ft)`
  display: flex;
  border: 1px solid ${({theme:e})=>e.colors.neutral200};
  border-radius: ${({theme:e})=>e.borderRadius};
  overflow: hidden;
`,ge=x(Gt)`
  display: flex;
  align-items: center;
  gap: ${({theme:e})=>e.spaces[2]};
  padding: ${({theme:e})=>`${e.spaces[2]} ${e.spaces[4]}`};
  border: none;
  background: ${({theme:e})=>e.colors.neutral0};
  color: ${({theme:e})=>e.colors.neutral800};
  cursor: pointer;
  font-size: ${({theme:e})=>e.fontSizes[1]};
  font-weight: ${({theme:e})=>e.fontWeights.semiBold};

  &:hover {
    background: ${({theme:e})=>e.colors.neutral100};
  }

  &[data-state='on'] {
    background: ${({theme:e})=>e.colors.neutral150};
  }

  svg {
    width: 1.6rem;
    height: 1.6rem;
  }
`,mo=x.div`
  [data-strapi-header] {
    background: ${({theme:e})=>e.colors.neutral0};

    h1 {
      font-size: 1.8rem;
    }
  }
`,ho=()=>{const{formatMessage:e}=A(),[o,n]=rt(Wt.view,O.GRID),s=o===O.GRID,r=d.useRef(null),c=d.useRef(null),[i]=st(),l=async(u,b)=>{if(u.length===0)return;const y=new FormData,M=[];u.forEach(m=>{y.append("files",m),M.push({name:m.name,caption:null,alternativeText:null,folder:b})}),y.append("fileInfo",JSON.stringify(M));try{await i({formData:y,totalFiles:u.length}).unwrap()}catch{}},p=()=>{r.current?.click()},f=async u=>{const b=u.target.files;b&&b.length>0&&await l(Array.from(b),null),u.target.value=""},a=async u=>{await l(u,null)};return t.jsx(oo,{onDrop:a,children:t.jsx(D,{ref:c,children:t.jsxs(K.Root,{minHeight:"100vh",background:"neutral0",children:[t.jsx(he,{children:t.jsx("input",{type:"file",ref:r,onChange:f,multiple:!0})}),t.jsx(mo,{children:t.jsx(K.Header,{title:"TODO: Folder name",primaryAction:t.jsx(lt,{popoverPlacement:"bottom-end",variant:"default",endIcon:t.jsx(ut,{}),label:e({id:v("new"),defaultMessage:"New"}),children:t.jsx(ct,{onSelect:p,startIcon:t.jsx(dt,{}),children:e({id:v("import-files"),defaultMessage:"Import files"})})}),subtitle:t.jsxs(T,{justifyContent:"space-between",alignItems:"center",gap:4,width:"100%",children:[t.jsx(T,{gap:4,alignItems:"center",children:"TODO: Filters and search"}),t.jsxs(T,{gap:4,alignItems:"center",children:[t.jsx(D,{children:"TODO: Sort"}),t.jsxs(fo,{type:"single",value:s?"grid":"table",onValueChange:u=>u&&n(u==="grid"?O.GRID:O.TABLE),"aria-label":e({id:v("view.switch.label"),defaultMessage:"View options"}),children:[t.jsxs(ge,{value:"table","aria-label":e({id:v("view.table"),defaultMessage:"Table view"}),children:[t.jsx(at,{}),e({id:v("view.table"),defaultMessage:"Table view"})]}),t.jsxs(ge,{value:"grid","aria-label":e({id:v("view.grid"),defaultMessage:"Grid view"}),children:[t.jsx(it,{}),e({id:v("view.grid"),defaultMessage:"Grid view"})]})]})]})]})})}),t.jsx(K.Content,{children:t.jsxs(so,{children:[t.jsx(io,{uploadDropZoneRef:c}),t.jsx(po,{view:o})]})})]})})})},bo=()=>{const{formatMessage:e}=A(),o=e({id:v("plugin.name"),defaultMessage:"Media Library"});return t.jsxs(se.Main,{children:[t.jsx(se.Title,{children:o}),t.jsx(pt,{children:t.jsx(ft,{index:!0,element:t.jsx(ho,{})})})]})};export{bo as UnstableMediaLibrary};
