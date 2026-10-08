<?php
		$this->load->view('admin/header');
		$this->load->view('admin/leftside');
?>

<div class="box box-primary">
   <div class="col-xs-8">
            <div class="box-header with-border">
               <h2 align="center" font-weight=" bold">Resim Galeri Ekleme</h2>
            </div>
			<?php if($this->session->flashdata('sonuc')){?>
				<div class="callout callout-info">
				<h4>İşlem:</h4>
				<p><?=$this->session->flashdata('sonuc')?></p>
				
              </div>
			  </div>
				<?php } ?>
          
           <form action="<?=base_url()?>admin/urunler/resim_galeri_upload/<?=$id?>" method="post" enctype="multipart/form-data">		   
		  
		   <input type="file" name="resim" size="20"  onChange="this.form.submit()" required class="form-control" />
		  
	
				<br>
			
			</form>
			<table border="3" bordercolor="grey"  >
	<tr >
			<?php
				foreach ($veriler as $rs)
				{?>
						<td >
					  <a href ="<?=base_url()?>admin/urunler/resimsil/<?=$rs->Id?>/<?=$id?>"onclick="return confirm('Silmek istediğinize emin misiniz?')" ><img height ="100" weight="100" src="<?=base_url()?>uploads/<?=$rs->resim?>" alt="Photo"> </a>
                   </td>
				   <td>&nbsp </td>
			<?php } ?>
			 
			</tr>
			</table>
     </div>
    
  </div>

  <?php
		$this->load->view('admin/footer');
	
?>
